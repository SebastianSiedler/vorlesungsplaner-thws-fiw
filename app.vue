<template>
  <v-app>
    <v-main>
      <v-container>
        <div>
          <div class="text-h5">Selected Events</div>

          <v-data-table
            :headers="headers"
            :items="[...selectedEvents.values()]"
            item-value="id"
            hide-default-footer
          >
            <template v-slot:item.actions="{ item }">
              <v-btn
                @click="() => selectedEvents.delete(item.id)"
                color="error"
                small
              >
                Remove
              </v-btn>
            </template>

            <template v-slot:item.studyGroups="{ value }">
              <div>
                <v-chip v-for="group in value.split(',')">
                  {{ group }}
                </v-chip>
              </div>
            </template>

            <template v-slot:no-data>
              Bitte füge erst einige Kurse hinzu!</template
            >
          </v-data-table>
        </div>

        <!-- Textbox to copy ical url -->
        <div>
          <span> {{ icalUrl }} </span>
          <v-icon @click="copyIcalUrl"> mdi-content-copy </v-icon>
        </div>

        <!-- Button to download iCal -->
        <v-btn
          @click="downloadCalendar"
          color="primary"
          append-icon="mdi-download"
        >
          Download iCal
        </v-btn>

        <!-- Vuetify Data Table to show events -->
        <v-data-table
          :headers="headers"
          :items="events.state.value"
          :search="search"
          item-value="id"
          :loading="events.isLoading.value"
          @update:options="loadItems"
        >
          <template v-slot:top>
            <v-toolbar flat class="d-flex align-center">
              <v-toolbar-title>Classes</v-toolbar-title>
              <!-- Search Field for the Data Table -->
              <v-text-field
                v-model="search"
                label="Search Events"
                clearable
                class="ma-2"
                density="compact"
                hide-details
              />
            </v-toolbar>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              v-if="!selectedEvents.has(item.id)"
              @click="() => selectedEvents.set(item.id, item)"
              color="primary"
              small
            >
              Add
            </v-btn>
            <v-btn
              v-else
              @click="() => selectedEvents.delete(item.id)"
              color="error"
              small
            >
              Remove
            </v-btn>
          </template>

          <template v-slot:item.studyGroups="{ value }">
            <div class="d-flex ga-1">
              <v-chip v-for="group in value.split(',')">
                {{ group }}
              </v-chip>
            </div>
          </template>

          <template v-slot:item.upcomingSubEventDate="{ value }">
            {{ new Date(value).toLocaleString("de") }}
          </template>

          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>
        </v-data-table>

        <div>
          © {{ new Date().getFullYear() }} Sebastian Siedler · Lizensiert unter
          der MIT Linzenz · Source auf
          <a
            href="https://github.com/SebastianSiedler/vorlesungsplaner-thws-fiw"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { client, type Event } from "./fiwClient";
import { useAsyncState, useClipboard } from "@vueuse/core";
import { VDataTable } from "vuetify/components";

// State
const selectedEvents = reactive(new Map<number, Event>());
const search = ref("");

// Table headers
const headers: VDataTable["$props"]["headers"] = [
  { title: "Event Name", value: "name" },
  { title: "Lecturer", value: "lecturerNames" },
  { title: "Module Number", value: "moduleNumber" },
  { title: "studyGroups", value: "studyGroups" },
  { title: "upcomingSubEventDate", value: "upcomingSubEventDate" },
  { title: "Actions", value: "actions", sortable: false },
];

// API call to fetch events
const events = useAsyncState(client.getEvents, [], { throwError: true });

const loadItems: VDataTable["$props"]["onUpdate:options"] = (args) => {
  const { page, itemsPerPage, search } = args;
  console.log(args);
  events.execute(0, {
    q: search,
    size: itemsPerPage === -1 ? 1000 : itemsPerPage,
    offset: (page - 1) * itemsPerPage,
  });
};

const icalUrl = computed(() => {
  return (
    window.location.origin +
    `/api/classes?classes=${[...selectedEvents.values()]
      .map((event) => event.id)
      .join(",")}`
  );
});

const { text, copy, copied, isSupported } = useClipboard({ source: icalUrl });

const copyIcalUrl = async () => {
  await copy();
  if (copied.value) {
    console.log("Copied to clipboard");
  }
};
const downloadCalendar = () => {
  window.location.href = icalUrl.value;
};
</script>
