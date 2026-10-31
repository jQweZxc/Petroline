class MetricsCalculator {
    calculate(samples) {
        if (samples.length <= 1) {
            return {
                span_s: 0,
                working_s: 0,
                stopped_s: 0,
                gap_s: 0,
                invalid_s: 0,
                unknown_s: 0,
                modes_s: { low: 0, normal: 0, high: 0 },
                intervals: []
            };
        }

        let working_s = 0;
        let stopped_s = 0;
        let gap_s = 0;
        let invalid_s = 0;
        let modes_s = { low: 0, normal: 0, high: 0 };
        const intervals = [];

        for (let i = 0; i < samples.length - 1; i++) {
            const current = samples[i];
            const next = samples[i + 1];
            const dt = next.t_s - current.t_s;

            let state;
            let mode = null;

            // Приоритет 1: Пропуск
            if (dt > 1.5) {
                state = 'gap';
                gap_s += dt;
            }
            // Приоритет 2: Недостоверные данные
            else if (!current.valid || 
                     current.pressure_mpa === null || 
                     current.rpm === null || 
                     current.pressure_mpa < 0 || 
                     current.rpm < 0) {
                state = 'invalid';
                invalid_s += dt;
            }
            // Приоритет 3: Работа или остановка
            else if (current.rpm >= 50 && current.pressure_mpa >= 1) {
                state = 'working';
                working_s += dt;

                // Определяем режим
                if (current.pressure_mpa >= 1 && current.pressure_mpa < 5) {
                    mode = 'low';
                    modes_s.low += dt;
                } else if (current.pressure_mpa >= 5 && current.pressure_mpa < 10) {
                    mode = 'normal';
                    modes_s.normal += dt;
                } else if (current.pressure_mpa >= 10) {
                    mode = 'high';
                    modes_s.high += dt;
                }
            } else {
                state = 'stopped';
                stopped_s += dt;
            }

            intervals.push({
                start: current.t_s,
                end: next.t_s,
                dt: dt,
                state: state,
                mode: mode,
                pressure: current.pressure_mpa,
                rpm: current.rpm
            });
        }

        const span_s = samples[samples.length - 1].t_s - samples[0].t_s;
        const unknown_s = gap_s + invalid_s;

        return {
            span_s,
            working_s,
            stopped_s,
            gap_s,
            invalid_s,
            unknown_s,
            modes_s,
            intervals
        };
    }
}