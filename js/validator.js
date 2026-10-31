class DataValidator {
    validate(data) {
        // Проверка обязательных полей корневого объекта
        const requiredRootFields = ['schema_version', 'dataset_id', 'synthetic', 'samples'];
        for (const field of requiredRootFields) {
            if (!(field in data)) {
                return {
                    valid: false,
                    error: `Отсутствует обязательное поле: ${field}`
                };
            }
        }

        // Проверка версии
        if (data.schema_version !== '1.0') {
            return {
                valid: false,
                error: `Неверная версия схемы: ${data.schema_version}. Ожидается "1.0"`
            };
        }

        // Проверка samples
        if (!Array.isArray(data.samples)) {
            return {
                valid: false,
                error: `Поле samples должно быть массивом`
            };
        }

        // Проверка каждой записи
        const requiredSampleFields = ['t_s', 'pressure_mpa', 'rpm', 'valid'];
        let prevTime = -1;

        for (let i = 0; i < data.samples.length; i++) {
            const sample = data.samples[i];

            // Проверка обязательных полей
            for (const field of requiredSampleFields) {
                if (!(field in sample)) {
                    return {
                        valid: false,
                        error: `В samples[${i}] отсутствует поле ${field}`
                    };
                }
            }

            // Проверка t_s
            if (typeof sample.t_s !== 'number' || !isFinite(sample.t_s) || sample.t_s < 0) {
                return {
                    valid: false,
                    error: `В samples[${i}].t_s некорректное значение: ${sample.t_s}`
                };
            }

            // Проверка строгого возрастания времени
            if (sample.t_s <= prevTime) {
                return {
                    valid: false,
                    error: `samples[${i}].t_s (${sample.t_s}) не больше предыдущего (${prevTime})`
                };
            }
            prevTime = sample.t_s;

            // Проверка pressure_mpa
            if (sample.pressure_mpa !== null) {
                if (typeof sample.pressure_mpa !== 'number' || !isFinite(sample.pressure_mpa)) {
                    return {
                        valid: false,
                        error: `В samples[${i}].pressure_mpa записана не число: ${JSON.stringify(sample.pressure_mpa)}`
                    };
                }
            }

            // Проверка rpm
            if (sample.rpm !== null) {
                if (typeof sample.rpm !== 'number' || !isFinite(sample.rpm)) {
                    return {
                        valid: false,
                        error: `В samples[${i}].rpm записана не число: ${JSON.stringify(sample.rpm)}`
                    };
                }
            }

            // Проверка valid
            if (typeof sample.valid !== 'boolean') {
                return {
                    valid: false,
                    error: `В samples[${i}].valid должно быть логическим значением`
                };
            }
        }

        return { valid: true, error: null };
    }
}