import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
    const params = Object.fromEntries(url.searchParams);
    const path = url.pathname.replace('/mobile-promotions/', '').split('/')[0];

    console.log(`Mobile promotions request: ${req.method} ${path}`, params);

    // GET /promotions - Get active promotions
    if (req.method === 'GET' && (path === '' || path === 'promotions' || path === 'mobile-promotions')) {
      const { lat, lng, category } = params;
      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;
      const today = new Date().toISOString().split('T')[0];

      const { data: promotions, error } = await supabase
        .from('promotions')
        .select(`
          *,
          medicines:medicine_id (*),
          branches:branch_id (id, name, location, latitude, longitude, phone)
        `)
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_until', today);

      if (error) throw error;

      const results = (promotions || [])
        .filter(p => !category || p.medicines?.category === category)
        .map(p => {
          let distance_km = null;
          if (userLat && userLng && p.branches?.latitude && p.branches?.longitude) {
            distance_km = calculateDistance(userLat, userLng, p.branches.latitude, p.branches.longitude);
          }

          // Get original price from branch stock
          return {
            id: p.id,
            medicine: {
              id: p.medicines?.id,
              name: p.medicines?.name,
              category: p.medicines?.category,
              description: p.medicines?.description,
            },
            branch: {
              id: p.branches?.id,
              name: p.branches?.name,
              location: {
                address: p.branches?.location,
                latitude: p.branches?.latitude,
                longitude: p.branches?.longitude,
                distance_km,
              },
            },
            discount_percentage: p.discount_percentage,
            promotional_price: p.promotional_price,
            description: p.description,
            valid_from: p.valid_from,
            valid_until: p.valid_until,
            is_featured: p.is_featured,
            created_at: p.created_at,
          };
        })
        .sort((a, b) => {
          // Sort by featured first, then by distance
          if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
          return (a.branch.location.distance_km || 999) - (b.branch.location.distance_km || 999);
        });

      return new Response(JSON.stringify({ promotions: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /nearby - Get nearby promotions for notifications
    if (req.method === 'GET' && path === 'nearby') {
      const { lat, lng, radius = '5' } = params;
      
      if (!lat || !lng) {
        return new Response(JSON.stringify({ error: 'Location required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const searchRadius = parseFloat(radius);
      const today = new Date().toISOString().split('T')[0];

      const { data: promotions, error } = await supabase
        .from('promotions')
        .select(`
          *,
          medicines:medicine_id (name, category),
          branches:branch_id (name, latitude, longitude)
        `)
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_until', today);

      if (error) throw error;

      const nearbyPromos = (promotions || [])
        .filter(p => {
          if (!p.branches?.latitude || !p.branches?.longitude) return false;
          const distance = calculateDistance(userLat, userLng, p.branches.latitude, p.branches.longitude);
          return distance <= searchRadius;
        })
        .map(p => {
          const distance_km = calculateDistance(userLat, userLng, p.branches.latitude, p.branches.longitude);
          const validUntil = new Date(p.valid_until);
          const daysRemaining = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          return {
            id: p.id,
            title: `${p.discount_percentage}% Off on ${p.medicines?.category}`,
            message: `Special offer at ${p.branches?.name} (${distance_km.toFixed(1)} km away)`,
            medicine_name: p.medicines?.name,
            discount_percentage: p.discount_percentage,
            branch_name: p.branches?.name,
            distance_km: Math.round(distance_km * 10) / 10,
            expires_in_days: daysRemaining,
          };
        })
        .sort((a, b) => a.distance_km - b.distance_km);

      return new Response(JSON.stringify({ new_promotions: nearbyPromos }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /promotions - Create promotion (owner only)
    if (req.method === 'POST') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const { 
        branch_id, medicine_id, discount_percentage, promotional_price,
        description, valid_from, valid_until, is_featured, notification_enabled 
      } = body;

      if (!branch_id || !medicine_id || !discount_percentage || !valid_from || !valid_until) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: promotion, error } = await supabase
        .from('promotions')
        .insert({
          branch_id,
          medicine_id,
          discount_percentage,
          promotional_price,
          description,
          valid_from,
          valid_until,
          is_featured: is_featured || false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Create promotion error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If notification enabled, create notifications for nearby users
      if (notification_enabled) {
        const { data: branch } = await supabase
          .from('branches')
          .select('latitude, longitude, name')
          .eq('id', branch_id)
          .single();

        if (branch?.latitude && branch?.longitude) {
          const { data: nearbyUsers } = await supabase
            .from('mobile_users')
            .select('id, latitude, longitude, notification_radius');

          const { data: medicine } = await supabase
            .from('medicines')
            .select('name')
            .eq('id', medicine_id)
            .single();

          for (const user of nearbyUsers || []) {
            if (!user.latitude || !user.longitude) continue;
            const distance = calculateDistance(
              user.latitude, user.longitude,
              branch.latitude, branch.longitude
            );
            if (distance <= (user.notification_radius || 10)) {
              await supabase.from('user_notifications').insert({
                user_id: user.id,
                promotion_id: promotion.id,
                title: `${discount_percentage}% Off on ${medicine?.name}`,
                message: `Special offer at ${branch.name}!`,
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ promotion }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /promotions/:id - Update promotion
    if (req.method === 'PUT') {
      const promotionId = url.pathname.split('/').pop();
      const body = await req.json();

      const { data: promotion, error } = await supabase
        .from('promotions')
        .update(body)
        .eq('id', promotionId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ promotion }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /promotions/:id - Delete promotion
    if (req.method === 'DELETE') {
      const promotionId = url.pathname.split('/').pop();

      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mobile promotions error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
