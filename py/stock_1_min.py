import adata
df = adata.fund.market.get_market_etf_min(fund_code='510300')
df.to_csv(f'300_20260105_分钟线.csv')
