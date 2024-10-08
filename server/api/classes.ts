import { DateTime } from "luxon";
import { defineEventHandler, getQuery } from "h3";
import ical, { ICalEventData } from "ical-generator";
import { client } from "~/fiwClient";
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
  const classIds = classes.split(",");

  // Create a new iCal instance
  const calendar = ical({
    name: "Vorlesungsplan",
    timezone: "Europe/Berlin",
    description: "Vorlesungsplan für die angegebenen Klassen",
    prodId: {
      company: "THWS Student",
      product: "ical-generator",
      language: "DE",
    },
  });

  try {
    // Fetch all events and sub-events in parallel
    await Promise.all(
      classIds.map(async (classId) => {
        try {
          const eventData = await client.getEventById(Number(classId));
          const subEvents = await client.getSubEvents(Number(classId));

          // Fetch all sub-event details in parallel
          const subEventDetails = await Promise.all(
            subEvents.map((subEvent) =>
              client.getSubEventById(Number(classId), subEvent.id)
            )
          );

          const startTime = DateTime.fromISO(subEventDetails[0].startTime)
            .setZone("Europe/Berlin")
            .toJSDate();
          console.log("startTime", subEventDetails[0].startTime, startTime);

          // Add each sub-event to the calendar
          subEventDetails.forEach((detailedSubEvent) => {
            const eventDetails: ICalEventData = {
              start: DateTime.fromISO(detailedSubEvent.startTime)
                .setZone("Europe/Berlin")
                .toJSDate(),
              end: DateTime.fromISO(detailedSubEvent.endTime)
                .setZone("Europe/Berlin")
                .toJSDate(),
              summary: eventData.name,
              description: `Dozent: ${eventData.lecturerNames}`,
              location: detailedSubEvent.rooms,
              url: eventData.icalUrl.href,
              timezone: "Europe/Berlin",
            };

            calendar.createEvent(eventDetails);
          });
        } catch (error) {
          console.error(`Error fetching event with ID ${classId}:`, error);
          throw new Error(`Error fetching event with ID ${classId}`);
        }
      })
    );

    // Return the iCal content
    event.node.res.setHeader("Content-Type", "text/calendar;charset=UTF-8");
    event.node.res.setHeader(
      "Content-Disposition",
      'attachment; filename="vorlesungsplan.ics"'
    );

    return calendar.toString(); // Returns iCal data as string
  } catch (error) {
    console.error("Error fetching events or sub-events:", error);
    return {
      status: 500,
      message: "Error fetching events.",
    };
  }
});
