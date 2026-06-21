import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Since we had issues with SSR cookies, we will use a simpler approach.
// We will require the user to pass their token in the Authorization header.
// But to make it even easier for you, we will just create an endpoint you can hit from a button.

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Invalid token or not logged in' }, { status: 401 });
    }

    // Define seed helper arrays
    const PUNE_LOCATIONS = [
      'Koregaon Park, Pune',
      'Kalyani Nagar, Pune',
      'Baner, Pune',
      'Viman Nagar, Pune',
      'Hinjewadi, Pune',
      'Kharadi, Pune',
      'Aundh, Pune',
      'Kothrud, Pune',
      'Hadapsar, Pune',
      'Senapati Bapat Road, Pune',
      'Shivaji Nagar, Pune'
    ];

    const PROPERTY_TYPES = ['Apartment', 'Luxury Apartment', 'Penthouse', 'Villa', 'Commercial Space', 'Plot'];
    const LEAD_SOURCES = ['Referral', 'Instagram', '99acres', 'MagicBricks', 'Walk-in', 'Website', 'Direct Call'];
    const STAGES = ['New inquiry', 'Site visit', 'Follow up', 'Closure'];
    const STATUSES = ['Hot', 'Warm', 'No answer', 'Not reachable', 'Switched off', 'Closed'];

    const INDIAN_FIRST_NAMES = [
      'Rajesh', 'Sunil', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Rohan', 'Aarti', 'Suresh', 'Pooja',
      'Sandeep', 'Neha', 'Ajay', 'Kirti', 'Manoj', 'Nitin', 'Swapnil', 'Harish', 'Deepak', 'Manish'
    ];

    const INDIAN_LAST_NAMES = [
      'Kumar', 'Deshmukh', 'Joshi', 'Patel', 'Kulkarni', 'Shinde', 'Mehta', 'Nair', 'Gokhale', 'Deshpande',
      'Patil', 'Sharma', 'Rao', 'Sawant', 'More', 'Phadke', 'Gupta', 'Malhotra'
    ];

    const PROJECT_PREFIXES = [
      'Eon', 'Supreme', 'Godrej', 'Panchshil', 'Marvel', 'Kolte Patil', 'Rohan', 'Blue Ridge', 'Amanora',
      'Verde', 'Yashwin', 'Lunkad', 'Vascon', 'Kumar', 'Verde', 'Castel Royale'
    ];

    const PROJECT_SUFFIXES = [
      'Waterfront', 'Greens', 'Meadows', 'Amore', 'Towers', 'Gateway', 'Evoque', 'Apostle', 'Residences',
      'Privilege', 'Primavera', 'Jade', 'Estia', 'Heights'
    ];

    const getRandomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const generatePhone = () => `+91 ${getRandomNumber(70000, 99999)} ${getRandomNumber(10000, 99999)}`;

    // Query current counts
    const leadRes = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const propRes = await supabase.from('properties').select('*', { count: 'exact', head: true });

    const currentLeadsCount = leadRes.count || 0;
    const currentPropertiesCount = propRes.count || 0;

    const targetLeads = 25;
    const targetProperties = 75;

    // Generate and insert leads if target not met
    if (currentLeadsCount < targetLeads) {
      const leadsNeeded = targetLeads - currentLeadsCount;
      const leadsToInsert = [];
      for (let i = 0; i < leadsNeeded; i++) {
        const firstName = getRandomElement(INDIAN_FIRST_NAMES);
        const lastName = getRandomElement(INDIAN_LAST_NAMES);
        const clientName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
        const budgetMin = getRandomNumber(25, 200) * 100000;
        const budgetMax = budgetMin + getRandomNumber(10, 50) * 100000;
        const propType = getRandomElement(PROPERTY_TYPES);
        
        let config = '3 BHK';
        if (propType === 'Apartment' || propType === 'Luxury Apartment' || propType === 'Penthouse') {
          config = getRandomElement(['2 BHK', '3 BHK', '4 BHK']);
        } else if (propType === 'Villa') {
          config = getRandomElement(['4 BHK', '5 BHK']);
        } else if (propType === 'Commercial Space') {
          config = 'Commercial Space';
        } else {
          config = 'N/A';
        }

        leadsToInsert.push({
          client_name: clientName,
          phone: generatePhone(),
          email: email,
          lead_source_id: getRandomElement(LEAD_SOURCES),
          budget_min: budgetMin,
          budget_max: budgetMax,
          preferred_location: getRandomElement(PUNE_LOCATIONS),
          property_type: propType,
          configuration: config,
          category: propType === 'Commercial Space' ? 'Commercial' : 'Residential',
          transaction_type: getRandomElement(['Outright', 'Rent']),
          stage_id: getRandomElement(STAGES),
          status: getRandomElement(STATUSES),
          notes: `Looking for a high-quality ${propType} in ${getRandomElement(PUNE_LOCATIONS).split(',')[0]}. Needs clean documentation and Vastu compliant entry.`,
          assigned_to: user.id
        });
      }

      const { error: insertLeadsError } = await supabase.from('leads').insert(leadsToInsert);
      if (insertLeadsError) {
        return NextResponse.json({ error: 'Lead Seed Error: ' + insertLeadsError.message }, { status: 500 });
      }
    }

    // Generate and insert properties if target not met
    if (currentPropertiesCount < targetProperties) {
      const propsNeeded = targetProperties - currentPropertiesCount;
      const propertiesToInsert = [];
      for (let i = 0; i < propsNeeded; i++) {
        const projPrefix = getRandomElement(PROJECT_PREFIXES);
        const projSuffix = getRandomElement(PROJECT_SUFFIXES);
        const title = `${projPrefix} ${projSuffix}`;
        const location = getRandomElement(PUNE_LOCATIONS);
        const propType = getRandomElement(PROPERTY_TYPES);
        
        let config = '3 BHK';
        let carpetArea = getRandomNumber(1200, 2400);
        let price = getRandomNumber(60, 220) * 100000;

        if (propType === 'Apartment') {
          config = getRandomElement(['2 BHK', '3 BHK']);
          carpetArea = getRandomNumber(900, 1600);
          price = getRandomNumber(50, 150) * 100000;
        } else if (propType === 'Luxury Apartment') {
          config = getRandomElement(['3 BHK', '4 BHK']);
          carpetArea = getRandomNumber(1800, 3200);
          price = getRandomNumber(180, 450) * 100000;
        } else if (propType === 'Penthouse') {
          config = getRandomElement(['4 BHK', '5 BHK']);
          carpetArea = getRandomNumber(3000, 5500);
          price = getRandomNumber(300, 900) * 100000;
        } else if (propType === 'Villa') {
          config = getRandomElement(['4 BHK', '5 BHK']);
          carpetArea = getRandomNumber(3500, 8000);
          price = getRandomNumber(400, 1500) * 100000;
        } else if (propType === 'Commercial Space') {
          config = 'Commercial Space';
          carpetArea = getRandomNumber(500, 5000);
          price = getRandomNumber(80, 1000) * 100000;
        } else if (propType === 'Plot') {
          config = 'N/A';
          carpetArea = getRandomNumber(2000, 10000);
          price = getRandomNumber(40, 500) * 100000;
        }

        const propCode = `PROP-${projPrefix.substring(0, 3).toUpperCase()}-${getRandomNumber(100, 999)}`;
        const ownerFirstName = getRandomElement(INDIAN_FIRST_NAMES);
        const ownerLastName = getRandomElement(INDIAN_LAST_NAMES);
        const ownerName = `${ownerFirstName} ${ownerLastName}`;

        propertiesToInsert.push({
          title: title,
          property_code: propCode,
          location: location,
          address: `${title}, Near ${location.split(',')[0]} Main Road, ${location}`,
          property_type: propType,
          configuration: config,
          carpet_area: carpetArea,
          price: price,
          status_id: getRandomElement(['Available', 'Available', 'Available', 'Under Offer']),
          listing_type: getRandomElement(['Sale', 'Sale', 'Rent']),
          owner_name: ownerName,
          owner_contact: generatePhone(),
          description: `Premium ${propType} project offering high-end amenities, club house, swimming pool, and round-the-clock security. Strategically located with easy accessibility to schools, hospitals and transport hubs.`
        });
      }

      // Chunk inserts of 50 to prevent payload limits
      const chunkSize = 50;
      for (let i = 0; i < propertiesToInsert.length; i += chunkSize) {
        const chunk = propertiesToInsert.slice(i, i + chunkSize);
        const { error: insertPropsError } = await supabase.from('properties').insert(chunk);
        if (insertPropsError) {
          return NextResponse.json({ error: 'Property Seed Error: ' + insertPropsError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
