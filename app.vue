<template>
  <v-app>
    <v-main>
      <v-container>
        <div>
          <v-data-table
            :headers="headers"
            :items="[...selectedEvents.values()]"
            item-value="id"
            hide-default-footer
          >
            <template v-slot:top>
              <v-toolbar flat class="d-flex align-center pr-4">
                <v-toolbar-title>Selected Events</v-toolbar-title>
                <!-- Button to download iCal -->
                <v-btn
                  v-if="selectedEvents.size > 0"
                  @click="downloadCalendar"
                  color="primary"
                  rounded
                  variant="flat"
                  prepend-icon="mdi-download"
                >
                  iCal
                </v-btn>
              </v-toolbar>
            </template>

            <template v-slot:headers="{ headers }">
              <tr v-for="(header, i) in headers" :key="i">
                <th
                  v-for="(h, i) in header"
                  :key="i"
                  class="body-2 font-weight-bold"
                >
                  {{ h.title }}
                </th>
              </tr>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                @click="() => selectedEvents.delete(item.id)"
                color="error"
                size="small"
                icon
                flat
              >
                <v-icon icon="mdi-delete" size="large" />
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
              {{ formatDate(value) }}
            </template>

            <template v-slot:no-data>
              <span> Bitte füge erst einige Kurse hinzu! </span>
            </template>

            <template v-slot:bottom>
              <v-row justify="end" class="mt-1">
                <v-col v-if="selectedEvents.size > 0">
                  <v-chip
                    color="light-gray"
                    append-icon="mdi-content-copy"
                    class="px-4 py-2"
                    :style="{
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      height: 'auto',
                    }"
                    @click="copyIcalUrl"
                  >
                    <span
                      class="text-decoration-underline"
                      style="user-select: text"
                    >
                      {{ icalUrl }}
                    </span>
                  </v-chip>
                  <v-snackbar v-model="copied">
                    URL in Zwischenablage kopiert
                  </v-snackbar>
                </v-col>
              </v-row>
            </template>
          </v-data-table>
        </div>

        <!-- Vuetify Data Table to show events -->
        <v-data-table
          :headers="headers"
          :items="events.state.value"
          :search="search"
          item-value="id"
          :loading="events.isLoading.value"
          @update:options="loadItems"
          class="mt-8"
        >
          <template v-slot:top>
            <v-toolbar flat class="d-flex align-center pr-4">
              <v-toolbar-title>Classes</v-toolbar-title>
              <!-- Search Field for the Data Table -->
              <v-text-field
                prepend-inner-icon="mdi-magnify"
                v-model="search"
                placeholder="Events suchen"
                clearable
                variant="outlined"
                rounded
                class="my-2"
                density="compact"
                color="grey"
                hide-details
              />
            </v-toolbar>
          </template>

          <template v-slot:headers="{ headers }">
            <tr v-for="(header, i) in headers" :key="i">
              <th
                v-for="(h, i) in header"
                :key="i"
                class="body-2 font-weight-bold"
              >
                {{ h.title }}
              </th>
            </tr>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              v-if="!selectedEvents.has(item.id)"
              @click="() => selectedEvents.set(item.id, item)"
              color="primary"
              size="small"
              icon
              flat
            >
              <v-icon icon="mdi-plus" size="x-large" />
            </v-btn>

            <v-btn
              v-else
              @click="() => selectedEvents.delete(item.id)"
              color="error"
              size="small"
              icon
              flat
            >
              <v-icon icon="mdi-delete" size="large" />
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
            {{ formatDate(value) }}
          </template>

          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>
        </v-data-table>

        <div>
          © {{ new Date().getFullYear() }} Sebastian Siedler · Lizenziert unter
          der MIT Lizenz · Source auf
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
import { ref } from "vue";
import { client, type Event } from "./fiwClient";
import { useAsyncState, useClipboard } from "@vueuse/core";
import { VDataTable } from "vuetify/components";

// State
const selectedEvents = reactive(new Map<number, Event>());
const search = ref("");

// Table headers
const headers: VDataTable["$props"]["headers"] = [
  { title: "Veranstaltung", value: "name" },
  { title: "Dozent(en)", value: "lecturerNames" },
  { title: "Module Number", value: "moduleNumber" },
  { title: "Studiengänge", value: "studyGroups" },
  { title: "Nächster Termin	", value: "upcomingSubEventDate" },
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

const { copy, copied } = useClipboard({ source: icalUrl });

const copyIcalUrl = async () => {
  await copy();
  if (copied.value) {
    console.log("Copied to clipboard");
  }
};
const downloadCalendar = () => {
  window.location.href = icalUrl.value;
};

// convert date to local string
const formatDate = (date: string) => {
  return new Date(date).toLocaleString("de");
};
</script>
