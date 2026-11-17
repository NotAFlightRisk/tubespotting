import { describe, expect, it } from 'vitest';
import { placeNotices } from '#lib/station/notices.js';

const LIFT =
  'No Step Free Access - No step free access between the National Rail concourse and the eastbound Circle line due to a faulty lift.';

describe('placeNotices', () => {
  it('says a notice once when TfL files it again under another heading or dash', () => {
    expect(
      placeNotices(
        [
          `Liverpool Street: ${LIFT}`,
          `Liverpool Street Station: ${LIFT}`,
          'Fulham Broadway: No Step Free Access - Step free access is not available to the westbound platform.',
          'Fulham Broadway: No Step Free Access- Step free access is not available to the westbound platform.',
          'Burnham: No Step Free Access - Step free access is not available due to a faulty lift.',
          'Burnham: Step free access is not available due to a faulty lift.'
        ],
        []
      )
    ).toEqual([
      `Liverpool Street: ${LIFT}`,
      'Fulham Broadway: No Step Free Access - Step free access is not available to the westbound platform.',
      'Burnham: No Step Free Access - Step free access is not available due to a faulty lift.'
    ]);
  });

  it('keeps different notices at one station', () => {
    const notices = [
      'Harrow & Wealdstone: No Step Free Access - Step free access is not available to platforms 4 and 5.',
      'Harrow & Wealdstone : Step free access is not available between the car park and the overbridge.',
      'Until 10:00, the lift to platform 1 is closed.',
      'Until 11:00, the lift to platform 1 is closed.'
    ];
    expect(placeNotices(notices, [])).toEqual(notices);
  });

  it("leaves out what a line's status says already, with or without its heading", () => {
    const delays = 'Severe delays due to an earlier faulty train at Gloucester Road.';
    const lift = 'Pimlico: reduced escalator service - there is no down escalator in service.';
    expect(
      placeNotices(
        [delays, 'Minor delays due to train cancellations.', lift],
        [`District Line: ${delays}`, 'Minor delays due to train cancellations.', null]
      )
    ).toEqual([lift]);
  });
});
