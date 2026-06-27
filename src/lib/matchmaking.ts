// src/lib/matchmaking.ts – property matching algorithm
import { supabase } from '@/lib/supabaseClient';

export interface Lead {
  id: string;
  client_name?: string;
  phone?: string;
  email?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  property_type?: string;
  configuration?: string;
  required_area?: number;
  purpose?: string;
  category?: string;
  transaction_type?: string;
}

export interface Property {
  id: string;
  title?: string;
  price?: number;
  location?: string;
  property_type?: string;
  configuration?: string;
  carpet_area?: number;
  listing_type?: string;
}

export async function findMatchesForLead(leadId: string) {
  // Fetch lead requirements
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  if (leadError) throw new Error(leadError.message);

  const leadReq = lead as Lead;

  // Fetch all active properties
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('*');
  if (propError) throw new Error(propError.message);

  const results = properties.map((prop) => {
    let score = 0;
    // Budget match (30)
    if (leadReq.budget_min && leadReq.budget_max && prop.price) {
      if (prop.price >= leadReq.budget_min && prop.price <= leadReq.budget_max) score += 30;
    }
    // Location match (25)
    if (leadReq.preferred_location && prop.location) {
      if (leadReq.preferred_location.toLowerCase() === prop.location.toLowerCase()) score += 25;
    }
    // Configuration match (20)
    if (leadReq.configuration && prop.configuration) {
      if (leadReq.configuration === prop.configuration) score += 20;
    }
    // Property type match (15)
    if (leadReq.property_type && prop.property_type) {
      if (leadReq.property_type === prop.property_type) score += 15;
    }
    // Area match (10)
    if (leadReq.required_area && prop.carpet_area) {
      const diff = Math.abs(leadReq.required_area - prop.carpet_area);
      if (diff <= 50) score += 10;
    }

    return {
      ...prop,
      match_score: score,
      match_reasons: generateMatchReasons(leadReq, prop)
    };
  });

  results.sort((a, b) => b.match_score - a.match_score);
  return results;
}

export async function findMatchesForProperty(propertyId: string) {
  // Fetch property details
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();
  if (propError) throw new Error(propError.message);

  const prop = property as Property;

  // Fetch all leads
  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('*');
  if (leadError) throw new Error(leadError.message);

  const results = leads.map((lead) => {
    const leadReq = lead as Lead;
    let score = 0;
    // Budget match (30)
    if (leadReq.budget_min && leadReq.budget_max && prop.price) {
      if (prop.price >= leadReq.budget_min && prop.price <= leadReq.budget_max) score += 30;
    }
    // Location match (25)
    if (leadReq.preferred_location && prop.location) {
      if (leadReq.preferred_location.toLowerCase() === prop.location.toLowerCase()) score += 25;
    }
    // Configuration match (20)
    if (leadReq.configuration && prop.configuration) {
      if (leadReq.configuration === prop.configuration) score += 20;
    }
    // Property type match (15)
    if (leadReq.property_type && prop.property_type) {
      if (leadReq.property_type === prop.property_type) score += 15;
    }
    // Area match (10)
    if (leadReq.required_area && prop.carpet_area) {
      const diff = Math.abs(leadReq.required_area - prop.carpet_area);
      if (diff <= 50) score += 10;
    }

    return {
      ...leadReq,
      match_score: score,
      match_reasons: generateMatchReasons(leadReq, prop)
    };
  });

  results.sort((a, b) => b.match_score - a.match_score);
  return results;
}

function generateMatchReasons(lead: Lead, prop: Property): string[] {
  const reasons: string[] = [];
  
  if (lead.budget_min && lead.budget_max && prop.price) {
    if (prop.price >= lead.budget_min && prop.price <= lead.budget_max) {
      reasons.push('Budget match');
    }
  }
  
  if (lead.preferred_location && prop.location) {
    if (lead.preferred_location.toLowerCase() === prop.location.toLowerCase()) {
      reasons.push('Location match');
    }
  }
  
  if (lead.configuration && prop.configuration) {
    if (lead.configuration === prop.configuration) {
      reasons.push('Configuration match');
    }
  }
  
  if (lead.property_type && prop.property_type) {
    if (lead.property_type === prop.property_type) {
      reasons.push('Property type match');
    }
  }
  
  if (lead.required_area && prop.carpet_area) {
    const diff = Math.abs(lead.required_area - prop.carpet_area);
    if (diff <= 50) {
      reasons.push('Area match');
    }
  }
  
  return reasons;
}
