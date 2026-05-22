import os
import time
import random
import logging
import redis
import psycopg2

REDIS_HOST   = os.getenv('REDIS_HOST',   'redis')
POSTGRES_DSN = os.getenv('POSTGRES_DSN', 'postgresql://appuser:apppass@postgres:5432/enterprise_db')
SERVICE_NAME = 'enterprise-worker'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)
logger = logging.getLogger(SERVICE_NAME)

def get_redis():
    return redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

def get_db():
    return psycopg2.connect(POSTGRES_DSN)

def process_order(order_id):
    conn = get_db()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE orders SET status = %s WHERE id = %s",
        ('processed', int(order_id))
    )
    conn.commit()
    cur.close()
    conn.close()
    logger.info(f'Order processed — id={order_id}')

def run():
    logger.info('Worker starting — consuming from order_queue')
    r = get_redis()
    while True:
        try:
            item = r.blpop('order_queue', timeout=5)
            if item:
                _, order_id = item
                process_order(order_id)
                time.sleep(random.uniform(0.1, 0.5))
        except Exception as e:
            logger.error(f'Worker error — {e}')
            time.sleep(2)

if __name__ == '__main__':
    time.sleep(10)
    run()