import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.CLIENT_USERNAME;
    const validPassword = process.env.CLIENT_PASSWORD;
    const secret = process.env.AUTH_SECRET || 'fallback-secret';

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { error: 'Configuración de autenticación no encontrada en el servidor.' },
        { status: 500 }
      );
    }

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // Create session token
    const token = Buffer.from(`authenticated:${secret}`).toString('base64');

    const response = NextResponse.json({ success: true });

    response.cookies.set('pos-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error procesando la solicitud.' },
      { status: 400 }
    );
  }
}
