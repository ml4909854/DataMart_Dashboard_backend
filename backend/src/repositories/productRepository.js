const supabase = require('../utils/database');

class ProductRepository {
    async findAll({ page = 1, limit = 20, search, searchType = 'all', category, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'desc' }) {
        try {
            console.log('🔍 Repository filters:', { page, limit, search, searchType, category, minPrice, maxPrice, sortBy, sortOrder });
            
            let query = supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    brand,
                    stock_quantity,
                    rating,
                    image_url,
                    created_at,
                    category_id,
                    categories!inner (
                        id,
                        name
                    )
                `, { count: 'exact' });

            // ✅ SEARCH HANDLING
            if (search && search.trim() !== '') {
                console.log('🔎 Applying search with type:', searchType);
                
                const cleanSearch = search.trim();
                
                if (searchType === 'name') {
                    // Search only in product name
                    query = query.ilike('name', `%${cleanSearch}%`);
                }
                else if (searchType === 'category') {
                    // ✅ FIXED: Category search - get category IDs first
                    const { data: matchingCategories } = await supabase
                        .from('categories')
                        .select('id')
                        .ilike('name', `%${cleanSearch}%`);
                    
                    if (matchingCategories && matchingCategories.length > 0) {
                        const categoryIds = matchingCategories.map(c => c.id);
                        console.log('Found category IDs:', categoryIds);
                        query = query.in('category_id', categoryIds);
                    } else {
                        console.log('No matching categories found');
                        return {
                            data: [],
                            pagination: {
                                page: parseInt(page),
                                limit: parseInt(limit),
                                total: 0,
                                totalPages: 0
                            }
                        };
                    }
                }
                else if (searchType === 'brand') {
                    // Search in brand
                    query = query.ilike('brand', `%${cleanSearch}%`);
                }
                else {
                    // ✅ FIXED: ALL FIELDS SEARCH
                    console.log('Searching in all fields for:', cleanSearch);
                    
                    // Search in name and brand
                    query = query.or(`name.ilike.%${cleanSearch}%,brand.ilike.%${cleanSearch}%`);
                    
                    // Also get matching category IDs
                    const { data: matchingCategories } = await supabase
                        .from('categories')
                        .select('id')
                        .ilike('name', `%${cleanSearch}%`);
                    
                    if (matchingCategories && matchingCategories.length > 0) {
                        const categoryIds = matchingCategories.map(c => c.id);
                        console.log('Also searching in categories:', categoryIds);
                        
                        // For Supabase, we need to handle this differently
                        // Let's get all products that match name/brand OR category
                        // We'll do this in two steps
                        
                        // First get products matching name/brand
                        const { data: nameBrandMatches } = await supabase
                            .from('products')
                            .select('id')
                            .or(`name.ilike.%${cleanSearch}%,brand.ilike.%${cleanSearch}%`);
                        
                        const nameBrandIds = (nameBrandMatches || []).map(p => p.id);
                        
                        // Then get products matching category
                        const { data: categoryMatches } = await supabase
                            .from('products')
                            .select('id')
                            .in('category_id', categoryIds);
                        
                        const categoryMatchIds = (categoryMatches || []).map(p => p.id);
                        
                        // Combine all matching IDs
                        const allMatchingIds = [...new Set([...nameBrandIds, ...categoryMatchIds])];
                        
                        console.log(`Found ${allMatchingIds.length} matching product IDs`);
                        
                        if (allMatchingIds.length > 0) {
                            query = query.in('id', allMatchingIds);
                        } else {
                            return {
                                data: [],
                                pagination: {
                                    page: parseInt(page),
                                    limit: parseInt(limit),
                                    total: 0,
                                    totalPages: 0
                                }
                            };
                        }
                    }
                }
            }
            
            // ✅ CATEGORY FILTER (from dropdown)
            if (category && category.trim() !== '') {
                console.log('📁 Applying category filter:', category);
                
                const { data: categoryData, error: categoryError } = await supabase
                    .from('categories')
                    .select('id')
                    .ilike('name', `%${category}%`)
                    .maybeSingle();
                
                if (categoryError) {
                    console.error('Category fetch error:', categoryError);
                }
                
                if (categoryData) {
                    console.log('Found category ID:', categoryData.id);
                    query = query.eq('category_id', categoryData.id);
                }
            }
            
            // ✅ PRICE RANGE
            if (minPrice && !isNaN(minPrice) && minPrice !== '') {
                query = query.gte('price', parseFloat(minPrice));
            }
            
            if (maxPrice && !isNaN(maxPrice) && maxPrice !== '') {
                query = query.lte('price', parseFloat(maxPrice));
            }

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            // Sorting
            if (sortBy === 'price' || sortBy === 'rating' || sortBy === 'name') {
                query = query.order(sortBy, { ascending: sortOrder === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error, count } = await query
                .range(from, to);

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            // Transform data
            const transformedData = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                brand: item.brand,
                stock_quantity: item.stock_quantity,
                rating: item.rating,
                image_url: item.image_url,
                created_at: item.created_at,
                category_id: item.category_id,
                category: item.categories?.name || 'Uncategorized'
            }));

            console.log(`✅ Found ${transformedData.length} products out of ${count || 0}`);
            
            return {
                data: transformedData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            };
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name,
                        description
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            if (data) {
                data.category = data.categories?.name || 'Uncategorized';
            }
            
            return data;
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }

    async getCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, description')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }

    async searchCategories(searchTerm) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .ilike('name', `%${searchTerm}%`)
                .limit(10);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }

    async getAllBrands() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('brand')
                .not('brand', 'is', null)
                .order('brand');

            if (error) throw error;
            
            const uniqueBrands = [...new Set(data.map(item => item.brand))];
            return uniqueBrands;
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }
}

module.exports = new ProductRepository();