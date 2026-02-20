import type { APIRoute } from "astro";

export const prerender = false;

type DvlaSuccess = {
  registrationNumber?: string;
  make?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;
  monthOfFirstRegistration?: string;
  co2Emissions?: number;
  euroStatus?: string;
  motStatus?: string;
  taxStatus?: string;
  taxDueDate?: string;
};

type DvlaErrorBody = {
  errors?: Array<{
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
  }>;
};

function normaliseVrm(input: string): string {
  return String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function friendlyVrmRulesMessage() {
  return "Enter a registration with letters and numbers only (no spaces). For example: TE57VRN";
}

async function readRawBody(request: Request): Promise<string> {
  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return "";
  return new TextDecoder("utf-8").decode(buf);
}

async function readVrmFromRequest(request: Request): Promise<{ vrm: string | null; rawLen: number; debug?: any }> {
  const raw = await readRawBody(request);
  const rawLen = raw.length;

  if (!raw || !raw.trim()) {
    return {
      vrm: null,
      rawLen,
      debug: {
        contentType: request.headers.get("content-type"),
        contentLength: request.headers.get("content-length"),
      },
    };
  }

  try {
    const parsed: any = JSON.parse(raw);
    const vrm = normaliseVrm(parsed?.registrationNumber);
    return { vrm: vrm || null, rawLen };
  } catch {
    try {
      const params = new URLSearchParams(raw);
      const vrm = normaliseVrm(String(params.get("registrationNumber") || params.get("vrm") || ""));
      return { vrm: vrm || null, rawLen };
    } catch {
      return { vrm: null, rawLen };
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.DVLA_API_KEY as string | undefined;
  const useUat = String(import.meta.env.DVLA_USE_UAT || "false").toLowerCase() === "true";

  if (!apiKey) {
    return json(500, {
      ok: false,
      error: "DVLA lookup isn’t configured on the server yet.",
      action: "Set DVLA_API_KEY in the server environment.",
    });
  }

  const { vrm, rawLen, debug } = await readVrmFromRequest(request);

  if (!vrm) {
    return json(400, {
      ok: false,
      error: "We couldn’t read that registration number.",
      help: friendlyVrmRulesMessage(),
      debug: debug ?? `Body length: ${rawLen}`,
    });
  }

  const url = useUat
    ? "https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles"
    : "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ registrationNumber: vrm }),
    });

    const text = await res.text();
    const parsed = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })()
      : null;

    if (!res.ok) {
      if (res.status === 404) {
        return json(404, {
          ok: false,
          error: "We couldn’t find a vehicle for that registration.",
          action: "Double-check the registration and try again.",
        });
      }

      if (res.status === 400) {
        const dvlaErr = (parsed as DvlaErrorBody | null)?.errors?.[0];
        return json(400, {
          ok: false,
          error: dvlaErr?.detail || "That registration number wasn’t accepted.",
          help: friendlyVrmRulesMessage(),
        });
      }

      if (res.status === 429) {
        return json(429, {
          ok: false,
          error: "The DVLA service is busy right now.",
          action: "Try again in a moment.",
        });
      }

      const dvlaErr = (parsed as DvlaErrorBody | null)?.errors?.[0];

      return json(res.status, {
        ok: false,
        error: "DVLA lookup failed.",
        action: "Try again shortly.",
        detail: dvlaErr?.detail || text || null,
      });
    }

    const data = (parsed || {}) as DvlaSuccess;

    return json(200, {
      ok: true,
      vrm,
      vehicle: {
        registrationNumber: data.registrationNumber,
        make: data.make,
        colour: data.colour,
        fuelType: data.fuelType,
        engineCapacity: data.engineCapacity,
        yearOfManufacture: data.yearOfManufacture,
        monthOfFirstRegistration: data.monthOfFirstRegistration,
        motStatus: data.motStatus,
        taxStatus: data.taxStatus,
        taxDueDate: data.taxDueDate,
        co2Emissions: data.co2Emissions,
        euroStatus: data.euroStatus,
      },
    });
  } catch (err: any) {
    return json(500, {
      ok: false,
      error: "We couldn’t reach the DVLA service.",
      action: "Try again in a moment.",
      detail: err?.message || String(err),
    });
  }
};
