import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase'; // Shared service-role client, used only for the profile lookup

// This function handles the login request when a user tries to sign in.
export const login = async (req: Request, res: Response) => {

  // Get the email and password sent by the frontend through the request body.
  const { email, password } = req.body;

  // Check if the email or password is missing.
  // If either is missing, stop the login process and send a 400 error.
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Create a temporary Supabase client specifically for user authentication.
    // This prevents the login session from affecting the shared server client.
    const authClient = createClient(
      process.env.SUPABASE_URL!,      // Get the Supabase project URL from the environment variables.
      process.env.SUPABASE_ANON_KEY!, // Get the public anon key from the environment variables.
      {
        auth: {
          persistSession: false, // Do not save the session inside this temporary client.
          autoRefreshToken: false // Do not automatically refresh the session token.
        }
      }
    );

    // Ask Supabase to verify the user's email and password.
    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    // Check if Supabase returned an error or did not provide a session.
    // A session contains the tokens needed to authenticate the user.
    // If login fails, send a 401 Unauthorized response.
    if (error || !data.session) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Retrieve the user's additional information from the profiles table.
    const { data: profile } = await supabase
      .from('profiles') // Select the profiles table.
      .select('name, role') // Only retrieve the name and role columns.
      .eq('id', data.user.id) // Find the profile matching the logged-in user's ID.
      .single(); // Return one matching profile instead of an array.

    // Send a successful login response back to the frontend.
    return res.status(200).json({
      message: 'Login successful',

      // Access token used to authenticate future requests.
      access_token: data.session.access_token,

      // Refresh token used to obtain a new access token when needed.
      refresh_token: data.session.refresh_token,

      // Return the user's basic account information and profile details.
      user: {
        id: data.user.id, // The unique ID assigned to the user by Supabase.
        name: profile?.name, // The user's name from the profiles table.
        email: data.user.email, // The email address associated with the account.
        role: profile?.role, // The user's assigned role, such as admin or user.
      },
    });

  } catch {
    // Handle unexpected errors that occur during the login process.
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};
