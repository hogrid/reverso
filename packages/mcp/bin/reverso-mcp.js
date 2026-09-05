#!/usr/bin/env node
// Stable entry point: exists at install time so package managers can link the
// binary before `dist/` is built (workspaces, fresh clones). The real CLI lives
// in dist/bin.js.
import "../dist/bin.js";
