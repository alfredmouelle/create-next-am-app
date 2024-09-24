#!/usr/bin/env node

import { createNextApp } from './commands/create-next-app';

createNextApp().catch(console.error);
