import { supabase } from '../lib/supabase';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        to_address: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        template_data: emailData.data,
        status: 'pending'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error queueing email:', error);
    return false;
  }
};

export const sendOrderConfirmation = async (orderId: string) => {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        user_profiles (
          email,
          first_name,
          last_name
        ),
        order_items (
          quantity,
          price_at_time,
          name_at_time
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Send confirmation email
    return await sendEmail({
      to: order.user_profiles.email,
      subject: `Order Confirmation #${order.order_number}`,
      template: 'order_confirmation',
      data: {
        orderNumber: order.order_number,
        customerName: `${order.user_profiles.first_name} ${order.user_profiles.last_name}`,
        items: order.order_items,
        shippingAddress: order.shipping_address,
        total: order.total_amount,
        orderDate: new Date(order.created_at).toLocaleDateString()
      }
    });
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return false;
  }
};

export const sendShippingUpdate = async (orderId: string, trackingInfo: {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
}) => {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        user_profiles (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Send shipping notification
    return await sendEmail({
      to: order.user_profiles.email,
      subject: `Your Order #${order.order_number} Has Shipped!`,
      template: 'shipping_notification',
      data: {
        orderNumber: order.order_number,
        customerName: `${order.user_profiles.first_name} ${order.user_profiles.last_name}`,
        carrier: trackingInfo.carrier,
        trackingNumber: trackingInfo.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl
      }
    });
  } catch (error) {
    console.error('Error sending shipping update:', error);
    return false;
  }
};