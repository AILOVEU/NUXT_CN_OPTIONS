option = {
    yAxis: [{
        type: "category",
        data: ["项目确定", "问卷设计", "试访", "问卷确定", "实地执行", "数据录入", "数据分析"]
    }],
    xAxis: [{
        type: 'value',
    }],
    series: [{
            name: "辅助",
            type: "bar",
            stack: "总",
            barWidth: 20,
            itemStyle: {
                normal: {
                    barBorderColor: 'rgba(0,0,0,0)',
                    color: 'rgba(0,0,0,0)'
                }
            },
            data: [0, 1, 2, 3, 4, 5, 6]
        },
        {
            name: "项目确定",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [3, 0, 0, 0, 0, 0, 0]
        },
        {
            name: "问卷设计",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [0, 4, 0, 0, 0, 0, 0]
        },
        {
            name: "试访",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [0, 0, 2, 0, 0, 0, 0]
        },
        {
            name: "问卷确定",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [0, 0, 0, 5, 0, 0, 0]
        },
        {
            name: "实地执行",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [0, 0, 0, 0, 4, 0, 0]
        },
        {
            name: "数据录入",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [0, 0, 0, 0, 0, 2, 0]
        },
        {
            name: "数据分析",
            type: "bar",
            barWidth: 20,
            stack: "总",
            data: [0, 0, 0, 0, 0, 0, 3]
        },
        {
            name: "当前",
            type: "scatter",
            data: [1, 2, 3, 4, 5, 6, 7]
        }
    ]
};