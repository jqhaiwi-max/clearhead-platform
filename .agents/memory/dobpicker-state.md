---
name: DOBPicker controlled input pattern
description: Why multi-part date pickers need internal useState rather than deriving from value prop
---

# DOBPicker Internal State Pattern

## The Rule
Any multi-part date/time picker (month + day + year dropdowns) must maintain internal `useState` for each part independently. Never derive all three parts from the parent `value` prop on every render.

## Why
When the user selects month but year is still empty, `emit("")` is called (incomplete date). The parent `value` prop stays `""`. On the next render, all three parts are re-derived from `""` → all dropdowns reset to their placeholder. The user's month selection disappears.

## How to Apply
```tsx
// ✅ CORRECT — internal state persists partial selections
const [month, setMonth] = useState(init[1] ?? "");
const [day,   setDay  ] = useState(init[2] ?? "");
const [year,  setYear ] = useState(init[0] ?? "");

<select value={month} onChange={e => { setMonth(e.target.value); emit(year, e.target.value, day); }}>
```

```tsx
// ❌ WRONG — re-derives from value prop, wiping partial selections
const parts = value ? value.split("-") : ["", "", ""];
const curMonth = parts[1] ?? "";
<select value={curMonth} onChange={e => emit(curYear, e.target.value, curDay)}>
```

This pattern applies to any compound input where the parent only knows about the complete value (not partials).
