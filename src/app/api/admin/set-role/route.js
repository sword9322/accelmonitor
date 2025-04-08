import { NextResponse } from 'next/server';

// Get the backend API URL from environment variables
const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function POST(request) {
  if (!BACKEND_API_URL) {
    console.error('BACKEND_API_URL environment variable is not set.');
    return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    // Get the token from the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Get the request body
    const body = await request.json();
    
    // Call the backend API with the token
    const response = await fetch(`${BACKEND_API_URL}/admin/set-role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      // Forward the error from the backend
      const errorData = await response.json();
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    // Return the data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in set role API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 