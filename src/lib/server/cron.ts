import cron from 'node-cron';
import prisma from './prisma';
import { sendPushNotification } from './push';

let isStarted = false;

export function startDailyPushCron() {
    if (isStarted) return;
    isStarted = true;

    // Срабатывает каждый день в 07:00
    cron.schedule('0 7 * * *', async () => {
        try {
            console.log('[CRON] Запуск утренней рассылки уведомлений (7:00)...');
            
            // Начало и конец текущего дня
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const assignments = await prisma.taskAssignment.findMany({
                where: {
                    status: 'ACCEPTED',
                    task: {
                        date: {
                            gte: todayStart,
                            lte: todayEnd
                        }
                    }
                },
                include: { task: true }
            });

            // Группировка по userId
            const userTasks: Record<string, string[]> = {};
            for (const assignment of assignments) {
                if (!userTasks[assignment.userId]) {
                    userTasks[assignment.userId] = [];
                }
                userTasks[assignment.userId].push(assignment.task.number);
            }

            // Рассылка (каждому свой список)
            for (const [userId, taskNumbers] of Object.entries(userTasks)) {
                const message = `Ваши заявки на сегодня: ${taskNumbers.join(', ')}`;
                console.log(`[CRON] Отправка пуша для ${userId}: ${message}`);
                await sendPushNotification(userId, 'План на день', message);
            }
            
            console.log('[CRON] Утренняя рассылка успешно завершена.');
        } catch (error) {
            console.error('[CRON] Ошибка во время утренней рассылки:', error);
        }
    });

    console.log('[CRON] Ежедневная рассылка пуш-уведомлений (07:00) запланирована.');
}
