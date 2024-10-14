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
                <v-toolbar-title>{{ $t("selectedEvents") }}</v-toolbar-title>
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
              <span>
                {{ $t("eventTable.message.pleaseAddSomeEventsFirst") }}
              </span>
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
                    {{ $t("snackbar.urlCopiedToClipboard") }}
                  </v-snackbar>
                </v-col>
              </v-row>
            </template>
          </v-data-table>
        </div>

        <!-- Vuetify Data Table to show events -->
        <v-data-table-server
          :headers="headers"
          :items="events.state.value?.events || []"
          :search="search"
          item-value="id"
          :items-length="events.state.value?.headers?.totalNumberOfResults ?? 0"
          v-model:items-per-page="itemsPerPage"
          :items-per-page-options="itemsPerPageOptions"
          :loading="events.isLoading.value"
          @update:options="loadItems"
          class="mt-8"
        >
          <template v-slot:top>
            <v-toolbar flat class="d-flex align-center pr-4">
              <v-toolbar-title>{{ $t("allEvents") }}</v-toolbar-title>
              <!-- Search Field for the Data Table -->
              <v-text-field
                prepend-inner-icon="mdi-magnify"
                v-model="search"
                :placeholder="$t('searchEvents')"
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
            <v-skeleton-loader
              :type="`table-row@${itemsPerPage}`"
            ></v-skeleton-loader>
          </template>
        </v-data-table-server>

        <div>
          © {{ new Date().getFullYear() }} Sebastian Siedler ·
          {{ $t("footer.licensedUnderTheMITLicense") }} ·
          {{ $t("footer.sourceCodeOn") }}
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
import { z } from "zod";
const { t } = useI18n();

// State
const selectedEvents = reactive(new Map<number, Event>());
const search = ref("");
const itemsPerPage = ref(10);
const itemsPerPageOptions = [5, 10, 15, 20];

// Table headers
const headers = computed<VDataTable["$props"]["headers"]>(() => [
  { title: t("eventTable.header.event"), value: "name" },
  { title: t("eventTable.header.lecturer(s)"), value: "lecturerNames" },
  { title: t("eventTable.header.moduleNumber"), value: "moduleNumber" },
  { title: t("eventTable.header.studyPrograms"), value: "studyGroups" },
  { title: t("eventTable.header.nextDate"), value: "upcomingSubEventDate" },
  { title: t("eventTable.header.actions"), value: "actions", sortable: false },
]);

// API call to fetch events
const events = useAsyncState(client.getEvents, null, {
  throwError: true,
  immediate: false,
  resetOnExecute: false,
});

const loadItems: VDataTable["$props"]["onUpdate:options"] = (args) => {
  const parsedArgs = z
    .object({
      page: z.number(),
      itemsPerPage: z.number(),
      search: z.string(),
    })
    .parse(args);

  const { page, itemsPerPage, search } = parsedArgs;

  events.execute(0, {
    q: search,
    size: itemsPerPage,
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

// add selected events to URL
watch(selectedEvents, () => {
  const selectedEventIds = [...selectedEvents.values()].map(
    (event) => event.id
  );
  const url = new URL(window.location.href);
  if (selectedEventIds.length === 0) {
    url.searchParams.delete("events");
  } else {
    url.searchParams.set("events", selectedEventIds.join(","));
  }
  window.history.replaceState({}, "", url.toString());
});

// load all valid events that are in the URL
onMounted(() => {
  const url = new URL(window.location.href);
  const events = url.searchParams.get("events");
  if (events) {
    const eventIds = events.split(",").map(Number);
    client.getEventsByIds(eventIds).then((events) => {
      events.forEach((event) => {
        selectedEvents.set(event.id, event);
      });
    });
  }
});
</script>
