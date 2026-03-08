import type { Component } from 'solid-js';

import { Tabs, TabsList, TabsTrigger } from '@/components/Tabs';

const App: Component = () => {
  return (
    <div class="max-w-3xl font-sans w-full mx-auto mt-24 flex flex-col items-center border border-border rounded-md p-4">
      <Tabs defaultValue="cron">
        <TabsList class="rounded-full">
          <TabsTrigger value="cron" class="rounded-full cursor-pointer">
            CRON
          </TabsTrigger>
          <TabsTrigger value="quartz" class="rounded-full cursor-pointer">
            Quartz
          </TabsTrigger>
          <TabsTrigger value="systemd" class="rounded-full cursor-pointer">
            Systemd
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default App;
