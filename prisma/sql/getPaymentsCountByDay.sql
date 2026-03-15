SELECT date_trunc('day', payment.created_at) "day", count(*) count
FROM payment
WHERE payment.created_at >= $1
GROUP BY 1
ORDER BY 1