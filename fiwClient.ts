import axios from "axios";
import { z } from "zod";

// Base URL der API
const API_BASE_URL = "https://fiwis.fiw.thws.de/fiwis/api";

// Zod Schema für einzelne Event Daten
const EventSchema = z.object({
  id: z.number(),
  lecturerNames: z.string(),
  moduleNumber: z.string(),
  name: z.string(),
  studyGroups: z.string(),
  upcomingSubEventDate: z.string(),
  icalUrl: z.object({
    href: z.string(),
    rel: z.string(),
    type: z.string(),
  }),
  self: z.object({
    href: z.string(),
    rel: z.string(),
    type: z.string(),
  }),
});
export type Event = z.infer<typeof EventSchema>;

// Zod Schema für die Liste der Events (getEvents)
const EventsListSchema = z.array(EventSchema);

// Zod Schema für ein einzelnes Event (getEventById)
const SingleEventSchema = z.object({
  id: z.number(),
  lecturerNames: z.string(),
  moduleNumber: z.string(),
  name: z.string(),
  note: z.string().optional(),
  studyGroups: z.string(),
  upcomingSubEventDate: z.string(),
  icalUrl: z.object({
    href: z.string(),
    rel: z.string(),
    type: z.string(),
  }),
  self: z.object({
    href: z.string(),
    rel: z.string(),
    type: z.string(),
  }),
  subEventUrl: z.object({
    href: z.string(),
    rel: z.string(),
    type: z.string(),
  }),
});

const SubEventSchema = z.object({
  id: z.number(),
  self: z.object({ href: z.string(), rel: z.string(), type: z.string() }),
});

export const SingleSubEventSchema = z.object({
  endTime: z.string(),
  id: z.number(),
  lecturerNames: z.string(),
  moduleNumber: z.string(),
  name: z.string(),
  rooms: z.string(),
  self: z.object({ href: z.string(), rel: z.string(), type: z.string() }),
  startTime: z.string(),
  studyGroups: z.string(),
  type: z.string(),
});

// Axios Client erstellen
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// API-Client Funktionen
export const client = {
  // Fetch für getEvents
  getEvents: async (params: { q?: string; offset?: number; size?: number }) => {
    const response = await axiosInstance.get("/events", { params });

    const headers = z
      .object({
        "x-totalnumberofresults": z.coerce.number().min(0),
        "x-numberofresults": z.coerce.number().min(0),
      })
      .parse(response.headers);

    // Zod zur Validierung der Antwort verwenden
    return {
      events: EventsListSchema.parse(response.data),
      headers: {
        totalNumberOfResults: headers["x-totalnumberofresults"],
        numberOfResults: headers["x-numberofresults"],
      },
    };
  },

  // Fetch für ein einzelnes Event (getEventById)
  getEventById: async (id: number) => {
    const response = await axiosInstance.get(`/events/${id}`);
    // Zod zur Validierung der Antwort verwenden
    return SingleEventSchema.parse(response.data);
  },

  // Fetch für Sub-Events eines Events (getSubEvents)
  getSubEvents: async (id: number) => {
    const response = await axiosInstance.get(`/events/${id}/subevents`);
    return SubEventSchema.array().parse(response.data); // Hier kannst du ein eigenes Schema hinzufügen, wenn nötig
  },

  // Fetch für ein Sub-Event (getSubEventById)
  getSubEventById: async (eventId: number, subEventId: number) => {
    const response = await axiosInstance.get(
      `/events/${eventId}/subevents/${subEventId}`
    );
    return SingleSubEventSchema.parse(response.data); // Hier kannst du ein eigenes Schema hinzufügen, wenn nötig
  },
};
