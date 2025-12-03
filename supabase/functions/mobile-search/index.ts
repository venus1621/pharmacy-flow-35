import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/mobile-search/', '').split('/')[0];
    const params = Object.fromEntries(url.searchParams);

    console.log(`Mobile search request: ${path}`, params);

    // GET /medicines/search - Search medicines across all branches
    if (path === 'medicines') {
      const { q, category, lat, lng, radius = '10' } = params;
      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;
      const searchRadius = parseFloat(radius);

      let medicinesQuery = supabase
        .from('medicines')
        .select('*');

      if (q) {
        medicinesQuery = medicinesQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%,manufacturer.ilike.%${q}%`);
      }
      if (category) {
        medicinesQuery = medicinesQuery.eq('category', category);
      }

      const { data: medicines, error: medError } = await medicinesQuery;
      if (medError) throw medError;

      // Get branch stock and promotions for each medicine
      const results = await Promise.all(medicines.map(async (medicine) => {
        const { data: stocks } = await supabase
          .from('branch_stock')
          .select(`
            *,
            branches:branch_id (id, name, location, phone, latitude, longitude, is_active)
          `)
          .eq('medicine_id', medicine.id)
          .gt('quantity', 0);

        const { data: promotions } = await supabase
          .from('promotions')
          .select('*')
          .eq('medicine_id', medicine.id)
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString().split('T')[0])
          .gte('valid_until', new Date().toISOString().split('T')[0]);

        const availability = (stocks || [])
          .filter(stock => stock.branches?.is_active)
          .map(stock => {
            const branch = stock.branches;
            let distance_km = null;
            if (userLat && userLng && branch.latitude && branch.longitude) {
              distance_km = calculateDistance(userLat, userLng, branch.latitude, branch.longitude);
            }
            return {
              branch_id: branch.id,
              branch_name: branch.name,
              location: {
                address: branch.location,
                latitude: branch.latitude,
                longitude: branch.longitude,
                distance_km,
              },
              quantity: stock.quantity,
              selling_price: stock.selling_price,
              in_stock: stock.quantity > 0,
            };
          })
          .filter(a => !userLat || !userLng || !a.location.distance_km || a.location.distance_km <= searchRadius)
          .sort((a, b) => (a.location.distance_km || 999) - (b.location.distance_km || 999));

        const activePromo = promotions?.[0];

        return {
          id: medicine.id,
          name: medicine.name,
          category: medicine.category,
          description: medicine.description,
          manufacturer: medicine.manufacturer,
          requires_prescription: medicine.requires_prescription,
          availability,
          is_promoted: !!activePromo,
          promotion: activePromo ? {
            discount_percentage: activePromo.discount_percentage,
            special_price: activePromo.promotional_price,
            valid_until: activePromo.valid_until,
          } : null,
        };
      }));

      // Filter medicines that have availability within radius
      const filteredResults = results.filter(m => m.availability.length > 0);

      return new Response(JSON.stringify({ medicines: filteredResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /medicine/:id - Get medicine details
    if (path === 'medicine') {
      const medicineId = url.pathname.split('/').pop();
      const { lat, lng } = params;
      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;

      const { data: medicine, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('id', medicineId)
        .single();

      if (error || !medicine) {
        return new Response(JSON.stringify({ error: 'Medicine not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: stocks } = await supabase
        .from('branch_stock')
        .select(`
          *,
          branches:branch_id (id, name, location, phone, latitude, longitude, is_active)
        `)
        .eq('medicine_id', medicineId)
        .gt('quantity', 0);

      const available_at = (stocks || [])
        .filter(stock => stock.branches?.is_active)
        .map(stock => {
          const branch = stock.branches;
          let distance_km = null;
          if (userLat && userLng && branch.latitude && branch.longitude) {
            distance_km = calculateDistance(userLat, userLng, branch.latitude, branch.longitude);
          }
          return {
            branch_id: branch.id,
            branch_name: branch.name,
            branch_phone: branch.phone,
            location: {
              address: branch.location,
              latitude: branch.latitude,
              longitude: branch.longitude,
              distance_km,
            },
            quantity: stock.quantity,
            selling_price: stock.selling_price,
            batch_number: stock.batch_number,
            expire_date: stock.expire_date,
          };
        })
        .sort((a, b) => (a.location.distance_km || 999) - (b.location.distance_km || 999));

      return new Response(JSON.stringify({
        medicine: { ...medicine, available_at }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /pharmacies - Search pharmacies by location
    if (path === 'pharmacies') {
      const { lat, lng, radius = '10', q } = params;
      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;
      const searchRadius = parseFloat(radius);

      let branchesQuery = supabase
        .from('branches')
        .select('*')
        .eq('is_active', true);

      if (q) {
        branchesQuery = branchesQuery.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
      }

      const { data: branches, error } = await branchesQuery;
      if (error) throw error;

      const pharmaciesMap = new Map();

      for (const branch of branches || []) {
        let distance_km = null;
        if (userLat && userLng && branch.latitude && branch.longitude) {
          distance_km = calculateDistance(userLat, userLng, branch.latitude, branch.longitude);
          if (distance_km > searchRadius) continue;
        }

        // Count medicines in branch
        const { count } = await supabase
          .from('branch_stock')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branch.id)
          .gt('quantity', 0);

        const branchData = {
          id: branch.id,
          name: branch.name,
          location: {
            address: branch.location,
            latitude: branch.latitude,
            longitude: branch.longitude,
            distance_km,
          },
          phone: branch.phone,
          is_active: branch.is_active,
          operating_hours: branch.operating_hours,
          medicines_count: count || 0,
        };

        // Group by pharmacy (using branch name prefix as pharmacy identifier)
        const pharmacyName = branch.name.split(' - ')[0] || branch.name;
        if (!pharmaciesMap.has(pharmacyName)) {
          pharmaciesMap.set(pharmacyName, {
            name: pharmacyName,
            branches: [],
          });
        }
        pharmaciesMap.get(pharmacyName).branches.push(branchData);
      }

      const pharmacies = Array.from(pharmaciesMap.values())
        .map(p => ({
          ...p,
          branches: p.branches.sort((a: any, b: any) => 
            (a.location.distance_km || 999) - (b.location.distance_km || 999)
          ),
        }))
        .sort((a, b) => 
          (a.branches[0]?.location.distance_km || 999) - (b.branches[0]?.location.distance_km || 999)
        );

      return new Response(JSON.stringify({ pharmacies }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /branches/:branchId/medicines - Get medicines at specific branch
    if (path === 'branches') {
      const pathParts = url.pathname.split('/');
      const branchId = pathParts[pathParts.indexOf('branches') + 1];
      const { category, in_stock } = params;

      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single();

      if (branchError || !branch) {
        return new Response(JSON.stringify({ error: 'Branch not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let stockQuery = supabase
        .from('branch_stock')
        .select(`
          *,
          medicines:medicine_id (*)
        `)
        .eq('branch_id', branchId);

      if (in_stock === 'true') {
        stockQuery = stockQuery.gt('quantity', 0);
      }

      const { data: stocks, error } = await stockQuery;
      if (error) throw error;

      let medicines = (stocks || []).map(stock => ({
        id: stock.medicines.id,
        name: stock.medicines.name,
        category: stock.medicines.category,
        description: stock.medicines.description,
        quantity: stock.quantity,
        selling_price: stock.selling_price,
        in_stock: stock.quantity > 0,
      }));

      if (category) {
        medicines = medicines.filter(m => m.category === category);
      }

      return new Response(JSON.stringify({
        branch: {
          id: branch.id,
          name: branch.name,
          location: {
            address: branch.location,
            latitude: branch.latitude,
            longitude: branch.longitude,
          },
        },
        medicines,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mobile search error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
