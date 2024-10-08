// server/api/classes.ts
import { defineEventHandler, getQuery } from "h3";
import ical, { ICalEventData } from "ical-generator";
import { client } from "~/fiwClient"; // Importiere die client.ts Datei
import z from "zod";

export default defineEventHandler(async (event) => {
  const querySchema = z.object({
    classes: z.string(),
  });

  // Parse the query parameters
  const parsedQuery = querySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    return {
      status: 400,
      message: parsedQuery.error,
    };
  }

  const { classes } = parsedQuery.data;

  // Get the class IDs from the query string
  const classIds = classes.split(",");

  // Create a new iCal instance
  const calendar = ical({
    name: "Vorlesungsplan",
    timezone: "Europe/Berlin",
  });

  // Fetch events for each class ID
  for (const classId of classIds) {
    try {
      const eventData = await client.getEventById(Number(classId)); // Fetch the event data
      const subEvents = await client.getSubEvents(Number(classId)); // Fetch sub-events

      // Add each sub-event to the calendar
      for (const subEvent of subEvents) {
        const detailedSubEvent = await client.getSubEventById(
          Number(classId),
          subEvent.id
        );
        const eventDetails: ICalEventData = {
          start: new Date(detailedSubEvent.startTime),
          end: new Date(detailedSubEvent.endTime),
          summary: eventData.name,
          description: `Dozent: ${eventData.lecturerNames}`,
          location: detailedSubEvent.rooms,
          url: eventData.icalUrl.href,
        };

        calendar.createEvent(eventDetails);
      }
    } catch (error) {
      console.error(`Error fetching event with ID ${classId}:`, error);
      return {
        status: 500,
        message: "Error fetching events.",
      };
    }
  }

  // Return the iCal content
  event.node.res.setHeader("Content-Type", "text/calendar;charset=UTF-8");
  event.node.res.setHeader(
    "Content-Disposition",
    'attachment; filename="vorlesungsplan.ics"'
  );

  return calendar.toString(); // Returns iCal data as string
});
