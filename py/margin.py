# 融资余额数据
import adata
df = adata.sentiment.securities_margin(start_date='2022-01-01')
df.to_csv(f'融资余额数据.csv')
print(df)

# rzye	decimal	融资余额（元）	1485586705452
# rqye	decimal	融券余额（元）	90400227216
# rzrqye	decimal	融资融券余额（元）	1575986932668
# rzrqyecz	decimal	融资融券余额差值（元）	1575986932668