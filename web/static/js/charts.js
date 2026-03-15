// web/static/js/charts.js

/**
 * Определяет время года по номеру недели.
 * @param {number} week - Номер недели (от 1 до 52/53).
 * @returns {string} Название сезона: 'winter', 'spring', 'summer', 'autumn'.
 */
function getSeason(week) {
    if (week >= 10 && week <= 22) return 'spring'; // Приблизительно: Март - Май
    if (week >= 23 && week <= 35) return 'summer'; // Приблизительно: Июнь - Август
    if (week >= 36 && week <= 48) return 'autumn'; // Приблизительно: Сентябрь - Ноябрь
    return 'winter'; // Приблизительно: Декабрь - Февраль
}

// Форматирование даты для сравнения с chronicles
function formatDateForChronicle(date) {
    return date.toISOString().split('T')[0];
}

// Вспомогательная функция для получения всех дат недели
function getDatesOfWeek(year, week) {
    const dates = [];
    const firstDay = new Date(year, 0, 1);
    const firstWeekDay = firstDay.getDay() || 7;
    let firstWeekDate = new Date(year, 0, 1 + (8 - firstWeekDay) % 7);

    if (week > 1) {
        firstWeekDate.setDate(firstWeekDate.getDate() + (week - 1) * 7);
    }

    for (let i = 0; i < 7; i++) {
        const date = new Date(firstWeekDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    return dates;
}

// Новая функция для обработки недельных интервалов
function getChroniclesForWeeks(weekLabels, appChronicles) {
    const result = [];

    weekLabels.forEach(weekLabel => {
        const [year, week] = weekLabel.split('-').map(Number);
        const weekDates = getDatesOfWeek(year, week);
        const weekEvents = [];

        weekDates.forEach(date => {
            const dateStr = formatDateForChronicle(date);
            if (appChronicles[dateStr]) {
                weekEvents.push(appChronicles[dateStr]);
            }
        });

        if (weekEvents.length > 0) {
            result.push({
                date: weekLabel,
                text: weekEvents.join('|') // Используем | как разделитель для нескольких событий
            });
        }
    });

    return result;
}

function getChroniclesInRange(labels, dateFrom, dateTo, appChronicles) {
    const result = [];
    labels.forEach(date => {
        if (appChronicles[date]) {
            result.push({
                date: date,
                text: appChronicles[date]
            });
        }
    });
    return result;
}

/**
 * Плагин для Chart.js для отображения времен года и новых годов.
 * - Рисует цветной фон для каждого сезона.
 * - Рисует вертикальную линию в начале каждого года.
 */
const seasonsPlugin = {
    id: 'seasonsPlugin',
    beforeDraw: (chart) => {
        const { ctx, chartArea: { top, bottom, right }, scales: { x } } = chart;
        
        // Проверяем, есть ли данные для отрисовки
        if (!chart.data.labels || chart.data.labels.length === 0) {
            return;
        }

        ctx.save();

        const seasonColors = {
            winter: 'rgba(173, 216, 230, 0.15)', // Светло-голубой
            spring: 'rgba(255, 182, 193, 0.15)', // Розоватый
            summer: 'rgba(144, 238, 144, 0.15)', // Сочно-зеленый
            autumn: 'rgba(255, 165, 0, 0.1)'    // Светло-оранжевый
        };

        let lastYear = null;

        chart.data.labels.forEach((label, index) => {
            const [year, week] = label.split('-').map(Number);
            
            // --- 1. Отрисовка фона для времени года ---
            const currentSeason = getSeason(week);
            ctx.fillStyle = seasonColors[currentSeason];

            const xStart = x.getPixelForValue(index);
            // Ширина столбца рассчитывается до следующей точки. Для последней точки - до края графика.
            const xEnd = (index < chart.data.labels.length - 1) ? x.getPixelForValue(index + 1) : right;
            const width = xEnd - xStart;

            ctx.fillRect(xStart, top, width, bottom - top);

            if (lastYear !== null && year > lastYear) {
                const lineColor = 'rgba(70, 130, 180, 0.7)'; // Стальной синий, сочетается с зимним фоном
                
                // --- Рисуем саму линию ---
                ctx.beginPath();
                ctx.moveTo(xStart, top);
                ctx.lineTo(xStart, bottom);
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = lineColor;
                ctx.stroke();

                // --- Добавляем текстовую метку ---
                ctx.save(); // Сохраняем состояние контекста перед трансформацией
                
                // Устанавливаем стили для текста
                ctx.font = '12px Arial';
                ctx.fillStyle = lineColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Перемещаем точку отсчета и поворачиваем холст для вертикального текста
                ctx.translate(xStart - 7, top + 50); // Смещаем вправо от линии и немного вниз
                ctx.rotate(-Math.PI / 2); // Поворачиваем на -90 градусов
                
                ctx.fillText('Новый год', 0, 0);
                
                ctx.restore(); // Возвращаем холст в исходное состояние
            }
            lastYear = year;
        });

        ctx.restore();
    }
};

function renderChart(targetId, endpoint, data, label, chroniclesInRange, showConfig) {
    const maxOnline = Math.max(...Object.values(data));
    const newLabels = Object.keys(data);
    const newData = Object.values(data);
    let chart = Chart.getChart(targetId);

    if (chart) {
        chart.data.datasets.push({
            label: label,
            data: newData,
            borderWidth: 1,
        });
        chart.update();
        return;
    }

    const activePlugins = [
        // Этот плагин используется для всех графиков
        {
            id: 'chroniclesPlugin',
            afterDraw: function(chart) {
                if (!showConfig.showChronicles) return;
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;

                chroniclesInRange.forEach(chronicle => {
                    const xPos = xAxis.getPixelForValue(chronicle.date);

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(xPos, yAxis.top);
                    ctx.lineTo(xPos, yAxis.bottom);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
                    ctx.stroke();
                    ctx.restore();
                });
            },
            afterEvent: function(chart, args) {
                if (!showConfig.showChronicles || args.event.type !== 'mousemove') return;
                if (args.event.type === 'mousemove') {
                    const xAxis = chart.scales.x;
                    const yAxis = chart.scales.y;
                    const ctx = chart.ctx;
                    const mouseX = args.event.x;

                    let closestChronicle = null;
                    let minDistance = Infinity;

                    chroniclesInRange.forEach(chronicle => {
                        const xPos = xAxis.getPixelForValue(chronicle.date);
                        const distance = Math.abs(mouseX - xPos);

                        if (distance < 50 && distance < minDistance) {
                            minDistance = distance;
                            closestChronicle = chronicle;
                        }
                    });

                    if (closestChronicle) {
                        const xPos = xAxis.getPixelForValue(closestChronicle.date);

                        chart.draw();

                            // Рисуем выделенную линию
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(xPos, yAxis.top);
                        ctx.lineTo(xPos, yAxis.bottom);
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                        ctx.stroke();

                            // Разбиваем текст на строки
                        const events = closestChronicle.text.split('|');

                            // Рассчитываем размеры текста
                        ctx.font = '12px Arial';
                        const lineHeight = 16;
                        let maxWidth = 0;

                            // Находим максимальную ширину текста
                        events.forEach(event => {
                            const width = ctx.measureText(event).width;
                            maxWidth = Math.max(maxWidth, width);
                        });

                            // Параметры блока с текстом
                        const padding = 10;
                        const rectWidth = maxWidth + padding * 2;
                        const rectHeight = events.length * lineHeight + padding * 2;
                        const centerX = chart.width / 2;
                        const centerY = 55;

                            // Рисуем полупрозрачный фон
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.lineWidth = 1;

                            // Закругленный прямоугольник
                        const radius = 5;
                        ctx.beginPath();
                        ctx.moveTo(centerX - rectWidth/2 + radius, centerY - rectHeight/2);
                        ctx.lineTo(centerX + rectWidth/2 - radius, centerY - rectHeight/2);
                        ctx.quadraticCurveTo(centerX + rectWidth/2, centerY - rectHeight/2,
                            centerX + rectWidth/2, centerY - rectHeight/2 + radius);
                        ctx.lineTo(centerX + rectWidth/2, centerY + rectHeight/2 - radius);
                        ctx.quadraticCurveTo(centerX + rectWidth/2, centerY + rectHeight/2,
                            centerX + rectWidth/2 - radius, centerY + rectHeight/2);
                        ctx.lineTo(centerX - rectWidth/2 + radius, centerY + rectHeight/2);
                        ctx.quadraticCurveTo(centerX - rectWidth/2, centerY + rectHeight/2,
                            centerX - rectWidth/2, centerY + rectHeight/2 - radius);
                        ctx.lineTo(centerX - rectWidth/2, centerY - rectHeight/2 + radius);
                        ctx.quadraticCurveTo(centerX - rectWidth/2, centerY - rectHeight/2,
                            centerX - rectWidth/2 + radius, centerY - rectHeight/2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();

                            // Рисуем текст
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        events.forEach((event, index) => {
                            const yPos = centerY - rectHeight/2 + padding + lineHeight/2 + index * lineHeight;
                            ctx.fillText(event, centerX, yPos);
                        });

                        ctx.restore();
                    }
                }
            }
        }
    ];

    // Добавляем плагин сезонов ТОЛЬКО для графика по неделям
    if (targetId === 'online-stat-all-weeks') {
        activePlugins.push(seasonsPlugin);
    }

    const canvas = document.getElementById(targetId);
    if (!canvas) {
        console.error(`Canvas ${targetId} not found`);
        return;
    }

    new Chart(
        canvas,
        {
            type: 'line',
            data: {
                labels: newLabels,
                datasets: [{
                    label: label,
                    data: newData,
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    colors: {
                        forceOverride: true
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                const label = context[0].label;
                                if (chroniclesInRange.find(c => c.date === label)) {
                                    const chronicle = chroniclesInRange.find(c => c.date === label);
                                    return `Events:\n${chronicle.text.split('|').join('\n')}`;
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        suggestedMin: 0,
                        suggestedMax: maxOnline + 10
                    },
                    x: { // Добавляем конфигурацию для оси X
                        grid: {
                            display: false // Скрываем вертикальную сетку
                        }
                    }
                }
            },
            // Передаем сюда наш массив с плагинами
            plugins: activePlugins
        }
    );
}
