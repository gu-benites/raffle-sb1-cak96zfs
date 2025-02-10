/*
  # Initial Schema Setup for Raffle Platform

  1. New Tables
    - users (managed by Supabase Auth)
    - raffles
      - Basic raffle information
      - Configuration for number of tickets and price
    - tickets
      - Tracks purchased tickets and their status
    - payments
      - Payment information and status

  2. Security
    - RLS policies for each table
    - Admin role setup
*/

-- Create admin role
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Raffles table
CREATE TABLE IF NOT EXISTS raffles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text,
  total_numbers integer NOT NULL,
  price_per_number decimal(10,2) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id uuid REFERENCES raffles(id),
  user_id uuid REFERENCES auth.users(id),
  number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(raffle_id, number)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  asaas_id text,
  pix_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for raffles
CREATE POLICY "Public raffles are viewable by everyone" 
  ON raffles FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Admins can do everything with raffles" 
  ON raffles FOR ALL 
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policies for tickets
CREATE POLICY "Users can view their own tickets" 
  ON tickets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets" 
  ON tickets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policies for payments
CREATE POLICY "Users can view their own payments" 
  ON payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
  ON payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);