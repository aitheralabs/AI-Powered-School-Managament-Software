-- Rename Stripe columns to Razorpay (Stripe gateway removed)
ALTER TABLE schools RENAME COLUMN stripe_customer_id     TO razorpay_customer_id;
ALTER TABLE schools RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;
