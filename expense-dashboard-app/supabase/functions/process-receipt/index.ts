import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user JWT token sent from frontend
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Unauthorized or missing user token')
    }

    const { base64Image } = await req.json()

    if (!base64Image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Example Backend Logic: Securely parse the receipt using Tesseract or an LLM
    // This removes the heavy processing and API keys from the client device!
    
    console.log(`Processing receipt for user: ${user.id}`);
    
    // MOCK RESULT
    const mockResult = {
      amount: 125.50,
      merchant: "Secure Store Inc.",
      date: new Date().toISOString(),
      category: "Shopping"
    }

    return new Response(JSON.stringify({ success: true, parsedData: mockResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
