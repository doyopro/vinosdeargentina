// Delivery policy. The server (create-payment-intent-v2) is the source of truth;
// these constants only drive the live estimate and the copy in the browser.
export type DeliveryMethod = "pickup" | "shipping";

export const FREE_SHIPPING_THRESHOLD = 200; // EUR, goods total after discount, IGIC included
export const SHIPPING_FEE = 20; // EUR, IGIC included

// Pickup point sent as the order address (the order form requires one).
export const PICKUP_ISLAND = "Lanzarote";
export const PICKUP_ADDRESS = "Retiro en Playa Honda (Lanzarote)";
export const PICKUP_POSTAL = "35509";

export const shippingFor = (method: DeliveryMethod, goodsTotal: number) =>
  method === "shipping" && goodsTotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
