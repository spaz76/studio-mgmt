"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * Number input that selects all text on focus,
 * so the previous value (e.g. "0") gets replaced when typing.
 */
const NumberInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      type="number"
      onFocus={(e) => {
        e.target.select();
        props.onFocus?.(e);
      }}
    />
  );
});

NumberInput.displayName = "NumberInput";

export { NumberInput };
