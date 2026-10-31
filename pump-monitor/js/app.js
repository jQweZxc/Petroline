const validator = new DataValidator();
const calculator = new MetricsCalculator();
let chart = null;

// Загрузка файла
async function loadFile(filename) {
    try {
        const response = await fetch(`data/${filename}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        showError(`Ошибка загрузки файла: ${error.message}`);
        return null;
    }
}

// Отображение ошибки
function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = `❌ ${message}`;
    errorBox.classList.remove('hidden');
}

// Скрытие ошибки
function hideError() {
    document.getElementById('errorBox').classList.add('hidden');
}

// Обновление метрик
function updateMetrics(metrics) {
    document.getElementById('span_s').textContent = metrics.span_s;
    document.getElementById('working_s').textContent = metrics.working_s;
    document.getElementById('stopped_s').textContent = metrics.stopped_s;
    document.getElementById('gap_s').textContent = metrics.gap_s;
    document.getElementById('invalid_s').textContent = metrics.invalid_s;
    document.getElementById('unknown_s').textContent = metrics.unknown_s;
    
    document.getElementById('low_s').textContent = metrics.modes_s.low;
    document.getElementById('normal_s').textContent = metrics.modes_s.normal;
    document.getElementById('high_s').textContent = metrics.modes_s.high;
    
    // Время с отклонением = low + high
    const deviation = metrics.modes_s.low + metrics.modes_s.high;
    document.getElementById('deviation_s').textContent = deviation;
}

// Построение графика
function buildChart(samples, intervals) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    // Подготовка данных
    const labels = samples.map(s => s.t_s);
    const pressureData = samples.map(s => s.pressure_mpa);
    const rpmData = samples.map(s => s.rpm);

    // Подготовка аннотаций для подсветки зон
    const annotations = {};
    intervals.forEach((interval, idx) => {
        let color;
        switch (interval.state) {
            case 'working':
                color = 'rgba(76, 175, 80, 0.15)';
                break;
            case 'invalid':
                color = 'rgba(244, 67, 54, 0.2)';
                break;
            case 'gap':
                color = 'rgba(158, 158, 158, 0.2)';
                break;
            case 'stopped':
                color = 'rgba(158, 158, 158, 0.1)';
                break;
        }

        annotations[`zone${idx}`] = {
            type: 'box',
            xMin: interval.start,
            xMax: interval.end,
            backgroundColor: color,
            borderWidth: 0
        };
    });

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Давление (МПа)',
                    data: pressureData,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    yAxisID: 'y',
                    tension: 0.1,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Обороты (RPM)',
                    data: rpmData,
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.1,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                annotation: {
                    annotations: annotations
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: (items) => `Время: ${items[0].label} с`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Время (секунды)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Давление (МПа)'
                    },
                    min: 0
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Обороты (RPM)'
                    },
                    min: 0,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Основная функция обработки
async function processFile(filename) {
    hideError();
    
    const data = await loadFile(filename);
    if (!data) return;

    // Валидация
    const validation = validator.validate(data);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }

    // Расчёт метрик
    const metrics = calculator.calculate(data.samples);
    updateMetrics(metrics);

    // Построение графика
    if (data.samples.length > 0) {
        buildChart(data.samples, metrics.intervals);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const fileSelect = document.getElementById('fileSelect');
    
    fileSelect.addEventListener('change', (e) => {
        processFile(e.target.value);
    });

    // Загрузка первого файла по умолчанию
    processFile(fileSelect.value);
    // Отладка
console.log('Chart.js загружен:', typeof Chart !== 'undefined');
console.log('Canvas найден:', document.getElementById('mainChart') !== null);
});