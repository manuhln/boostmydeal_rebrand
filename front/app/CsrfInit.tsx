"use client";
import { useEffect, useState } from "react";
import { initCsrf } from "@/lib/api-client";

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}
export function CsrfInit() {
  const existing = getCookie('XSRF-TOKEN');

  useEffect(() => {
    if (!existing) {
      initCsrf()
    }
  }, [existing]);
  return null
}