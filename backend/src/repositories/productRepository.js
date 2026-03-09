const supabase = require('../utils/database');

class ProductRepository {
    async findAll({ page = 1, limit = 20, search, searchType = 'all', category, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'desc' }) {
        try {
            console.log('🔍 Repository filters:', { page, limit, search, searchType, category, minPrice, maxPrice });
            
            // ✅ SIMPLE QUERY - No complex joins
            let query = supabase
                .from('products')
                .select(`
                    id,
                    name,
                    price,
                    brand,
                    rating,
                    image_url,
                    created_at,
                    category_id
                `, { count: 'exact' });

            // ✅ SEARCH HANDLING - Simplified
            if (search && search.trim() !== '') {
                const cleanSearch = search.trim();
                
                if (searchType === 'name') {
                    query = query.ilike('name', `%${cleanSearch}%`);
                }
                else if (searchType === 'brand') {
                    query = query.ilike('brand', `%${cleanSearch}%`);
                }
                else if (searchType === 'category') {
                    // First get category IDs
                    const { data: cats } = await supabase
                        .from('categories')
                        .select('id')
                        .ilike('name', `%${cleanSearch}%`);
                    
                    if (cats && cats.length > 0) {
                        const catIds = cats.map(c => c.id);
                        query = query.in('category_id', catIds);
                    } else {
                        return {
                            data: [],
                            pagination: { page, limit, total: 0, totalPages: 0 }
                        };
                    }
                }
                else {
                    // All fields - search in name and brand only
                    query = query.or(`name.ilike.%${cleanSearch}%,brand.ilike.%${cleanSearch}%`);
                }
            }

            // ✅ CATEGORY FILTER
            if (category && category.trim() !== '') {
                const { data: cat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('name', category.trim())
                    .single();
                
                if (cat) {
                    query = query.eq('category_id', cat.id);
                }
            }

            // ✅ PRICE FILTERS
            if (minPrice && !isNaN(minPrice)) {
                query = query.gte('price', parseFloat(minPrice));
            }
            if (maxPrice && !isNaN(maxPrice)) {
                query = query.lte('price', parseFloat(maxPrice));
            }

            // ✅ SORTING
            if (sortBy === 'price' || sortBy === 'rating' || sortBy === 'name') {
                query = query.order(sortBy, { ascending: sortOrder === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // ✅ PAGINATION
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await query.range(from, to);

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            // ✅ GET CATEGORY NAMES SEPARATELY
            const categoryIds = [...new Set(data.map(item => item.category_id).filter(Boolean))];
            
            let categoryMap = {};
            if (categoryIds.length > 0) {
                const { data: categories } = await supabase
                    .from('categories')
                    .select('id, name')
                    .in('id', categoryIds);
                
                categoryMap = (categories || []).reduce((acc, cat) => {
                    acc[cat.id] = cat.name;
                    return acc;
                }, {});
            }

            // ✅ TRANSFORM DATA
            const transformedData = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                brand: item.brand,
                rating: item.rating,
                image_url: item.image_url,
                created_at: item.created_at,
                category_id: item.category_id,
                category: categoryMap[item.category_id] || 'Uncategorized'
            }));

            console.log(`✅ Found ${transformedData.length} products`);
            
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
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            
            // Get category name separately
            if (data && data.category_id) {
                const { data: category } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('id', data.category_id)
                    .single();
                
                data.category = category?.name || 'Uncategorized';
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
                .select('id, name')
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