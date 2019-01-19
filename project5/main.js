(function () {
    // function loadData(file) {
    //     return new Promise((resolve, reject) => {
    //         d3.csv(file, function (error, data) {
    //             if (error) {
    //                 reject(error);
    //             } else {
    //                 resolve(data);
    //             }
    //         });
    //     });
    // }


    // loadData('100.csv').then(data => {
    //     console.log(data);
    // }).catch(error=>{
    //     console.log(error);
    // })

    const template = {
        numbers:100,
        pointWidth:4,
        pointMargin:6,
        width:1000,
        height:500
    }

    const _animation = {
        duration:1500,
        ease:d3.easeCubic
    }
    const ease = d3.easeCubic;
    const duration = 1500;
    //大洲为例子
    /**
     * Given a set of points, lay them out in a grid.
     * Mutates the `points` passed in by updating the x and y values.
     *
     * @param {Object[]} points The array of points to update. Will get `x` and `y` set.
     * @param {Number} pointWidth The size in pixels of the point's width. Should also include margin.
     * @param {Number} gridWidth The width of the grid of points
     *
     * @return {Object[]} points with modified x and y
     */
    function gridLayout(points, pointWidth,pointMargin, gridWidth,widthBaseline,heightBaseline) {
        const pointHeight = 2*pointWidth+pointMargin;
        pointWidth = pointHeight;
        const pointsPerRow = Math.floor(gridWidth / pointWidth);
        const numRows = points.length / pointsPerRow;

        points.forEach((point, i) => {
            point.x = widthBaseline + pointWidth * (i % pointsPerRow + 1);
            point.y = heightBaseline -pointHeight * (Math.floor(i / pointsPerRow)+1);
        });

        return points;
    }

    function randomLayout(points, pointWidth, width, height) {
        points.forEach((point, i) => {
            point.x = Math.random() * (width - pointWidth);
            point.y = Math.random() * (height - pointWidth);
        });
        return points;
    }

    function createPoints(numPoints, pointWidth, width, height) {
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([numPoints - 1, 0]);

        const points = d3.range(numPoints).map(id => ({
            id,
            // color: colorScale(id),
            color: '#ff0000'
        }));
        console.log(points[99]);
        return randomLayout(points, pointWidth, width, height);
    }

    function drawCatagories(key, width) {
        if (width == undefined) {
            width = template.width;
        }
        // default gridwidth:100
        const gridWidth = width / catagories[key].length;
        const gridMargin = 0.2 * gridWidth;
        let contents = catagories[key].content;
        //draw文字 canvas是全局变量
        let c = d3.select('.graph').select('canvas');
        const ctx =c.node().getContext('2d');
        // ctx.font = '16px serif';
        ctx.fillStyle = '#f03355';

        for (let index = 0; index < contents.length; index++) {
            // console.log('draw:',ctx);
            ctx.fillRect(gridWidth * index, 200, gridWidth-gridMargin, 8)
            ctx.strokeText(`${contents[index]}`, index * gridWidth ,220);
        }
        ctx.closePath();
        // console.log('drawCatagories');

    }

    function setCatagories(key,points, pointWidth, pointMargin, width) {
        // default gridwidth:100

        // document.getElementById('graph').append("<div class='sub'>Asia</div><div class='sub'>Africa</div>")
        const gridWidth = width/catagories[key].length;
        const gridMargin = 0.2*gridWidth;

        let sub = catagories[key].sub;
        let start_ = 0;
        let points_ = new Array();
        for (let index = 0; index < sub.length; index++) {
           points_.concat(gridLayout(points.slice(start_, start_ + sub[index]), pointWidth, pointMargin, gridWidth - gridMargin,gridWidth*index,200))
           start_ += sub[index];
        }
        // console.log(points_,"---------------");
        return points_;
    }
    let points = createPoints(template.numbers,template.pointWidth,template.width,template.height)
    // const toContinent = points => gridLayout(points,template.pointWidth,template.pointMargin,50);

    const toRandom = points => randomLayout(points,template.pointWidth,template.width,template.height);
    const toContinent = points => setCatagories(0, points, template.pointWidth, template.pointMargin,template.width);
    const toGender = points => setCatagories(1, points, template.pointWidth, template.pointMargin, template.width);
    const catagories = [
        {
            content: [
                'Asia',
                'Africa',
                'South America',
                'North America',
                'Europe'
            ],
            length: 5,
            catagories: 'Continent',
            sub: [60, 16, 9, 5, 10]
        }, {
            content: [
                'Female',
                'Male'
            ],
            length: 2,
            catagories: 'Gender',
            sub: [50, 50]
        }, {
            content: {
                'aged 0-14': 25,
                'aged 15-64': 66,
                'aged 65+': 9,
            },
            length: 3,
            catagories: 'Age',
            sub: [25,66,9]
        }, {
            content: {
                Christians: 31,
                Muslims: 23,
                'Hindus': 15,
                'Buddhists': 7,
                Other: 8,
                'No religion':16
            },
            length: 6,
            catagories: 'Religion',
            sub: [31,23,15,7,16]
        }, {
            content: {
                Asia: 60,
                Africa: 16,
                'South America': 9,
                'North America': 5,
                Europe: 10
            },
            length: 5,
            catagories: 'Continent',
            sub: [60, 16, 9, 5, 10]
        }, {
            content: {
                Asia: 60,
                Africa: 16,
                'South America': 9,
                'North America': 5,
                Europe: 10
            },
            length: 5,
            catagories: 'Continent',
            sub: [60, 16, 9, 5, 10]
        }, {
            content: {
                Asia: 60,
                Africa: 16,
                'South America': 9,
                'North America': 5,
                Europe: 10
            },
            length: 5,
            catagories: 'Continent',
            sub: [60, 16, 9, 5, 10]
        }, {
            content: {
                Asia: 60,
                Africa: 16,
                'South America': 9,
                'North America': 5,
                Europe: 10
            },
            length: 5,
            catagories: 'Continent',
            sub: [60, 16, 9, 5, 10]
        }

    ]
    let currLayout = 0;
    let timer;
    const layouts = [toRandom,toContinent,toGender];
    // animate the points to a given layout
    function animate(layout,index) {
        // timer.stop();
        // store the source position
        points.forEach(point => {
            point.sx = point.x;
            point.sy = point.y;
        });

        // get destination x and y position on each point
        layout(points);

        // store the destination position
        points.forEach(point => {
            point.tx = point.x;
            point.ty = point.y;
        });

        if (timer!==undefined) {
            timer.stop();
        }
        timer = d3.timer((elapsed) => {
            // compute how far through the animation we are (0 to 1)
            const t = Math.min(1, ease(elapsed / duration));

            // update point positions (interpolate between source and target)
            points.forEach(point => {
                point.x = point.sx * (1 - t) + point.tx * t;
                point.y = point.sy * (1 - t) + point.ty * t;
            });

            // update what is drawn on screen
            draw(index);

            // if (t==1 && type==2) {
            //     console.log('...');
            //     timer.stop();
            // }
        });
    }

    function drawCircle (x, y, r, start, end, color, type,ctx) {
        var unit = Math.PI / 180;
        ctx.beginPath();
        ctx.arc(x, y, r, start * unit, end * unit);
        ctx[type + 'Style'] = color;
        ctx.closePath();
        ctx[type]();
    }

    function draw(index) {
        const ctx = canvas.node().getContext('2d');
        ctx.save();

        ctx.clearRect(0, 0, template.width, template.height);

         // draw each point
         for (let i = 0; i < points.length; ++i) {
            const point = points[i];
            drawCircle(point.x,point.y,template.pointWidth,0,360,point.color,'fill',ctx)
            // ctx.fillStyle = point.color;
            // ctx.fillRect(point.x, point.y, template.pointWidth, template.pointWidth);
         }
        //  ctx.fillText("sss",20,20)
        //  console.log(ctx);
         ctx.restore();

// @Test
        // drawCatagories(1,template.width)
        if (index!==undefined) {
            drawCatagories(index, template.width)
        }
    }

    // create the canvas
    const screenScale = window.devicePixelRatio || 1;
    const canvas = d3.select('.graph').append('canvas')
        .attr('width', template.width * screenScale)
        .attr('height', template.height * screenScale)
        .style('width', `${template.width}px`)
        .style('height', `${template.height}px`);
    canvas.node().getContext('2d').scale(screenScale, screenScale);

    // start off as a grid
    // toGrid(points);
    // toContinent(points)
    draw();
    // animate(layouts[currLayout]);

    const points_bak = points;
    let timer2 = d3.timer(step);
    console.log(points);
    function step() {
        points.forEach(point => {
            //抖动效果
            // point.x += 2 * Math.random() - 1;
            // point.y += 2 * Math.random() - 1;
            if (point.id === 0) {
                point.x += Math.random() * 51 / 8;
                point.y += Math.random() * 51 / Math.sqrt(point.id);
            }
            if (point.id%2 === 0) {
                      point.x += Math.random() * (point.id + 1) / 8;
                      point.y += Math.random() *

                      (point.id + 1) / Math.sqrt(point.id);
            } else {
                 point.x -= Math.random() * (point.id + 1) / 8;
                 point.y -= Math.random() * (point.id + 1) / Math.sqrt(point.id);
            }
            if (point.x < 0) {
                point.x = template.width;
            }
            if (point.x > template.width) {
                point.x = 0;
            }
            if (point.y < 0) {
                point.y = template.height;
            }
            if (point.y > template.height) {
                point.y = 0;
            }
            // console.log(point.x,point.y);
        });
        draw();
    };

    function onClickCatagories() {
        document.getElementsByClassName('catagory')[0].addEventListener('click', event => {
                let target = event.target || event.srcElement;
                let childs = target.parentNode.children;
                for (let index = 0; index < childs.length; index++) {
                   childs[index].classList.remove('select');
                }
                // childs.forEach((e)=>e.classList.remove('select'));
                target.classList.add('select');
                let index = target.getAttribute('data-index');
                console.log(index);
                if (index) {
                     if (index == 0) {
                         timer.stop();

                         console.log('index:',index);
                        // animate(layouts[index],2)
                        points = createPoints(template.numbers, template.pointWidth, template.width, template.height)
                        // draw();
                        // points =
                        // points = layouts[0];
                        // for (let index = 0; index < points.length; index++) {
                        //    points[index] = points_bak[index]
                        // }
                        // draw();
                        // d3.timer(step);
                        // console.log(points);d
                        // setTimeout(() => {
                            d3.timer(step)
                        // }, 0);

                     } else {

                         animate(layouts[index],index-1);
                        //  drawCatagories(index-1,template.width);
                     }
                    //  if (index == 0) {
                    //     d3.timer(step)
                    //  }

                }

            },false);
      }

    onClickCatagories();
})()