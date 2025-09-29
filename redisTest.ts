import Redis from "@/lib/redis";

const redis = new Redis()
await redis.advertiseNewBuildJob("11111", "4")
await redis.quit()