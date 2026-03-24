"use client";

import { Search } from "lucide-react";

import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";

export function ServerSearch() {
  return (
    <div className="w-full max-w-sm">
      <InputGroup>
        <InputGroupAddon>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <input
          className="h-8 flex-1 bg-transparent px-2 text-sm outline-none"
          placeholder="Search servers..."
          aria-label="Search servers"
        />
      </InputGroup>
    </div>
  );
}
