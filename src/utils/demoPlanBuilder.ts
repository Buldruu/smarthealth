import type { AiDailyPlan, EveningCheckIn, IntakeAnalysis, UserProfile } from '../types';

export function buildTempDemoIntake(goalText: string): IntakeAnalysis {
  return {
    understoodGoal: `Таны зорилго: "${goalText}" — Өдөр тутмын алхалт болон Монголд олдоцтой тэнцвэртэй хооллолтоор аажмаар хэрэгжүүлнэ.`,
    encouragement: 'Сайн эхлэл байна! Жижиг боловч тогтмол алхмууд хамгийн бодитой үр дүн авчирдаг.',
    focusArea: 'Өдөр тутмын алхалт, тэнцвэртэй Монгол хоол, амралт',
    tailoredQuestions: [
      'Таны нас, өндөр, жин болон өдрийн хөдөлгөөний ачаалал ямар байдаг вэ?',
      'Хооллолтод анхаарах харшил эсвэл дургүй хүнс байгаа юу?',
      'Өдрийн аль цагт 20–40 минут алхахад хамгийн тохиромжтой вэ?',
    ],
  };
}

export function buildTempDemoPlan(profile: UserProfile): AiDailyPlan {
  const allergyNote =
    profile.allergies && profile.allergies !== 'Байхгүй'
      ? `(${profile.allergies} харшлыг хасаж тохируулав)`
      : '';

  return {
    summary: `${profile.name}-ийн "${profile.goalText}" зорилгод тохирсон өдөр тутмын эхлэлийн төлөвлөгөө (Түр демо горим).`,
    encouragement:
      'Өнөөдөр бүгдийг төгс хийх албагүй. Доорх 3 жижиг алхмаас эхэлж, орой нь ахицаа дүгнээрэй.',
    actions: [
      {
        id: `demo-task-1-${Date.now()}`,
        category: 'nutrition',
        title: 'Оройн хоолыг хөнгөлж уураг, ногоо нэмэх',
        detail: `Өөхгүй үхрийн махтай ногоотой шөл эсвэл аарц, тарагтай хөнгөн зууш сонгоно уу ${allergyNote}.`,
        done: false,
      },
      {
        id: `demo-task-2-${Date.now()}`,
        category: 'movement',
        title: 'Өдрийн алхалтыг 2 хэсэгт хувааж хийх',
        detail: `Өдрийн цайны дараа 15 минут, орой ${profile.schedule || 'ажлын дараа'} 25 минут алхаарай.`,
        done: false,
      },
      {
        id: `demo-task-3-${Date.now()}`,
        category: 'hydration',
        title: 'Цэвэр бүлээн ус ба нойрны цагаа барих',
        detail: 'Өдөрт 6–8 аяга бүлээн ус эсвэл чихэргүй чацарганатай ус ууж, унтахаас 1 цагийн өмнө дэлгэцээс холдоно.',
        done: false,
      },
    ],
    nutritionNote: `Монголд олдоцтой өглөөний овъёос эсвэл арвайн гурилтай зутан, өдрийн өөхгүй мах + байцаа/луувантай шөлөөр тэнцвэржүүлнэ ${allergyNote}.`,
    movementNote:
      'Гэнэт хүнд дасгал эхлэлгүй алхалтын хэмнэлээ аажмаар нэмж, 8,000 алхам тутамд 1 зоос цуглуулаарай.',
    hydrationNote: 'Өглөө босмогц 1 аяга бүлээн ус ууж бодисын солилцоогоо сэрээгээрэй.',
    restNote: 'Орой 23:00 цагаас өмнө амрахад бэлдэж, 7–8 цаг тайван унтахыг зориорой.',
    updatedAt: new Date().toISOString(),
  };
}

export function buildTempDemoCheckIn(
  profile: UserProfile,
  checkin: { energyLevel: number; mood: string; followedTasksCount: number; note: string }
): { checkInRecord: EveningCheckIn; nextPlan: AiDailyPlan } {
  const isTired = checkin.energyLevel <= 2;
  const aiAdjustment = isTired
    ? `Өнөөдөр эрч хүч бага (${checkin.energyLevel}/5) байсан тул маргааш ачааллыг зөөлрүүлж, сунгалт болон богино алхалтад төвлөрөхийг санал болголоо.`
    : `Өнөөдөр ${checkin.followedTasksCount} дадал биелүүлж сайн ахилаа! Маргаашийн төлөвлөгөөнд алхалтаа бага зэрэг ахиулж орууллаа.`;

  const basePlan = buildTempDemoPlan(profile);
  const nextPlan: AiDailyPlan = {
    ...basePlan,
    summary: `${profile.name}-ийн маргаашийн тохируулсан төлөвлөгөө (Түр демо горим).`,
    actions: [
      {
        id: `demo-next-1-${Date.now()}`,
        category: 'movement',
        title: isTired ? '20 минутын тайван сэргээх алхалт' : 'Үдийн дараа 25 минут идэвхтэй алхах',
        detail: isTired
          ? 'Хүчлэлгүйгээр цэвэр агаарт амьсгалаа тэгшилж алхаарай.'
          : 'Өчигдрийн эрч хүчийг хадгалж 8,000 алхмын зорилго руугаа ойртоорой.',
        done: false,
      },
      basePlan.actions[0],
      basePlan.actions[2],
    ],
  };

  return {
    checkInRecord: {
      id: `chk-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      energyLevel: checkin.energyLevel,
      mood: checkin.mood,
      followedTasksCount: checkin.followedTasksCount,
      note: checkin.note,
      aiAdjustment,
    },
    nextPlan,
  };
}
