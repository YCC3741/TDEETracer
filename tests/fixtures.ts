export const femaleProfileFixture = {
  sex: 'female',
  age: 30,
  height: 170,
  weight: 75,
  target: 65,
  factor: 1.375,
  intake: 1500,
  deficit: null,
  mode: 'intake',
  planStartedAt: '2026-08-11',
} as const

export const legacyDiaryFixture = {
  date: '2026-08-11',
  intake: 450,
  exerciseStatus: 'yes',
  exercises: [
    {
      presetId: 'walk',
      name: '走路（一般）',
      met: 3.5,
      minutes: 30,
      kcal: 128,
    },
  ],
  note: 'legacy',
  updatedAt: '2026-08-11T03:00:00.000Z',
}

export const expectedFemaleBmr = 1501.5
export const expectedFemaleTdee = 2064.5625
export const expectedPlannedProjectionDays = 157
