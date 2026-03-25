"use client";

import * as Sentry from "@sentry/nextjs";
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[web-vitals]", metric.name, metric.value, metric.rating);
      return;
    }

    Sentry.captureMessage(`web-vital:${metric.name}`, {
      level: "info",
      tags: {
        metric: metric.name,
        rating: metric.rating,
      },
      extra: {
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        navigationType: metric.navigationType,
      },
    });
  });

  return null;
}
