export default function Help() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>앱 소개 및 사용법</h2>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>🐣 이 앱은 뭔가요?</h3>
        <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.7 }}>
          목표를 달성하면 재화를 얻고, 그 재화로 캐릭터를 키우는 습관 형성 앱입니다.
          귀찮아서 미루던 일들을 캐릭터를 키우는 재미로 하나씩 해내다 보면
          어느새 습관이 됩니다.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>🎮 어떻게 하나요?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { emoji: '1️⃣', text: '목표 탭에서 오늘 할 일을 입력하세요' },
            { emoji: '2️⃣', text: '목표를 완료하면 코인과 에너지를 받아요' },
            { emoji: '3️⃣', text: '코인으로 알을 구매하세요' },
            { emoji: '4️⃣', text: '에너지로 밥을 사서 캐릭터에게 먹이세요' },
            { emoji: '5️⃣', text: '꾸준히 하면 캐릭터가 3단계까지 진화해요' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>📅 캘린더 가져오기</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.7 }}>
            목표 탭의 📅 캘린더 버튼을 누르면 오늘 일정을 목표로 가져올 수 있어요.
          </p>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8, color: '#2F6B5A' }}>🔗 구글 캘린더 URL 가져오는 방법</div>
          {[
            '구글 캘린더 → 설정 (톱니바퀴)',
            '내 캘린더 → 캘린더 이름 클릭',
            '"비공개 주소" 항목에서 ICS 복사',
            '목표 탭 → 📅 캘린더 → URL 붙여넣기'
          ].map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: '#444', display: 'flex', gap: 8 }}>
              <span style={{ color: '#2F6B5A', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>📱 홈 화면에 추가하는 방법</h3>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#2F6B5A' }}>🍎 아이폰 (iOS)</div>
          {['Safari 브라우저로 이 페이지를 열어주세요', '하단 가운데 공유 버튼 (네모에 화살표)을 누르세요', '"홈 화면에 추가"를 선택하세요', '"추가"를 누르면 완료!'].map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: '#444', display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#2F6B5A', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#2F6B5A' }}>🤖 안드로이드</div>
          {['Chrome 브라우저로 이 페이지를 열어주세요', '우측 상단 점 세 개 메뉴를 누르세요', '"홈 화면에 추가"를 선택하세요', '"추가"를 누르면 완료!'].map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: '#444', display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#2F6B5A', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>⚠️ 알아두세요</h3>
        {['7일 동안 밥을 주지 않으면 캐릭터가 괴물로 변해요', '목표 체크는 자정에 초기화됩니다', '파티를 만들어 친구들과 함께 목표를 달성하면 보상이 늘어납니다'].map((t, i) => (
          <div key={i} style={{ fontSize: 13, color: '#444', display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ flexShrink: 0 }}>•</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}