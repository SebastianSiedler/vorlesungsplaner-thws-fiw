<template>
  <div>
    <div>
      <div class="">Selected Events</div>
      <v-list>
        <v-list-item v-for="event in selectedEvents" :key="event.id">
          {{ event.name }}
          {{ event.lecturerNames }}
          {{ event.moduleNumber }}
          <v-btn
            @click="
              () => {
                selectedEvents = selectedEvents.filter(
                  (e) => e.id !== event.id
                );
              }
            "
          >
            Remove
          </v-btn>
        </v-list-item>
      </v-list>
    </div>

    <!-- Textbox to copy ical url -->
    <div>
      {{ icalUrl }}
    </div>

    <!-- Button to download iCal -->
    <v-btn @click="downloadCalendar">Download iCal</v-btn>

    <v-input v-model="query" label="Query"></v-input>

    <v-list>
      <v-list-item v-for="event in events.state.value" :key="event.id">
        {{ event.name }}
        {{ event.lecturerNames }}
        {{ event.moduleNumber }}

        <v-btn
          @click="
            () => {
              selectedEvents.push(event);
            }
          "
          >Add</v-btn
        >
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { client, type Event } from "./fiwClient";
import { useAsyncState } from "@vueuse/core";
// import { writeFileSync } from 'browser-fs-access';
import ical from "ical-generator";

// State
const selectedEvents = ref<Event[]>([]);
const query = ref("");

// API call to fetch events
const events = useAsyncState(
  async () => {
    return await client.getEvents({ q: query.value });
  },
  [],
  { throwError: true }
);

const icalUrl = computed(() => {
  return (
    window.location.origin +
    `/api/classes?classes=${selectedEvents.value
      .map((event) => event.id)
      .join(",")}`
  );
});

watch(query, () => {
  events.execute();
});

const downloadCalendar = () => {
  window.location.href = icalUrl.value;
};
</script>
