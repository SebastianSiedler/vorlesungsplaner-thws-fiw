<template>
  <div>
    <div>
      <div class="">Selected Events</div>
      <v-list>
        <v-list-item v-for="event in selectedEvents.values()" :key="event.id">
          {{ event.name }}
          {{ event.lecturerNames }}
          {{ event.moduleNumber }}
          <v-btn
            @click="
              () => {
                selectedEvents.delete(event.id);
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
        <v-toolbar flat>
          <v-toolbar-title>Classes</v-toolbar-title>
          <!-- Search Field for the Data Table -->
          <v-text-field
            v-model="search"
            label="Search Events"
            clearable
          ></v-text-field>
        </v-toolbar>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          @click="() => selectedEvents.set(item.id, item)"
          color="primary"
          small
        >
          Add
        </v-btn>
      </template>

      <template v-slot:item.studyGroups="{ value }">
        <div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { client, type Event } from "./fiwClient";
import { useAsyncState } from "@vueuse/core";
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

const downloadCalendar = () => {
  window.location.href = icalUrl.value;
};
</script>
