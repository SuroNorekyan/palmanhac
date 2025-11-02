export type OrderEventPayload = Record<string, unknown>;

export type OrderEvent = {
  type: string;
  message?: string;
  payload?: OrderEventPayload;
  createdAt?: string;
};

const isEventArray = (value: unknown): value is OrderEvent[] =>
  Array.isArray(value) &&
  value.every(
    (event) =>
      typeof event === "object" &&
      event !== null &&
      typeof (event as Partial<OrderEvent>).type === "string",
  );

export const appendOrderEvent = (existing: unknown, event: OrderEvent) => {
  const events = isEventArray(existing) ? existing : [];
  const timestamped: OrderEvent = {
    ...event,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };
  return [...events, timestamped];
};
