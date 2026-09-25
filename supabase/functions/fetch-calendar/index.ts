import ICAL from "npm:ical.js@2.1.0";

// 앱(브라우저)에서 이 함수를 호출할 수 있게 허용
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type CalEvent = { title: string; start: string; end: string; allDay: boolean };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 앱에서 받는 값: 캘린더 주소, 시작일, 종료일
    const { url, start, end } = await req.json();
    if (!url || !start || !end) {
      return json({ error: "url, start, end가 필요합니다" }, 400);
    }

    // webcal:// 주소는 https:// 로 바꿔서 요청
    const icsUrl = String(url).replace(/^webcal:\/\//i, "https://");
    const res = await fetch(icsUrl);
    if (!res.ok) {
      return json({ error: "캘린더를 불러오지 못했습니다" }, 502);
    }

    // 캘린더 파일(ICS) 해석
    const comp = new ICAL.Component(ICAL.parse(await res.text()));

    // 캘린더에 들어있는 시간대 정보 등록 (한국 시간 등)
    for (const tz of comp.getAllSubcomponents("vtimezone")) {
      ICAL.TimezoneService.register(new ICAL.Timezone(tz));
    }

    const rangeStart = ICAL.Time.fromJSDate(new Date(start), true);
    const rangeEnd = ICAL.Time.fromJSDate(new Date(end), true);
    const events: CalEvent[] = [];

    const toItem = (title: string, s: ICAL.Time, e: ICAL.Time): CalEvent => ({
      title: title || "(제목 없음)",
      start: s.toJSDate().toISOString(),
      end: e.toJSDate().toISOString(),
      allDay: s.isDate,
    });

    for (const v of comp.getAllSubcomponents("vevent")) {
      const ev = new ICAL.Event(v);

      if (ev.isRecurring()) {
        // 반복 일정: 기간 안에 해당하는 날짜만 펼쳐서 담기
        const it = ev.iterator();
        let next: ICAL.Time | null;
        let guard = 0;
        while ((next = it.next()) && guard++ < 2000) {
          if (next.compare(rangeEnd) > 0) break;
          if (next.compare(rangeStart) >= 0) {
            const occ = ev.getOccurrenceDetails(next);
            events.push(toItem(ev.summary, occ.startDate, occ.endDate));
          }
        }
      } else {
        // 단일 일정: 기간 안에 있으면 담기
        const s = ev.startDate;
        if (s.compare(rangeStart) >= 0 && s.compare(rangeEnd) <= 0) {
          events.push(toItem(ev.summary, s, ev.endDate ?? s));
        }
      }
    }

    events.sort((a, b) => a.start.localeCompare(b.start));
    return json({ events });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});