const BASIC_STRENGTH = 0.09;
const HEIGHT_FACTOR = 0.75;
const STRENGTH = 20;
const NODE_RADIUS = 10;
const COLOR = {
    brotherColor: '#a3e6e9',
    generalColor: '#6c5b7b',
    goodColor: '#7795c5'
}

function smoothScroll(target, duration) {
    var target = document.querySelector(target);
    var targetPosition = target.getBoundingClientRect().top;
    var startPosition = window.pageYOffset;
    var distance = targetPosition - startPosition;
    var startTime = null;

    function animationScroll(currentTime) {
        if (startTime === null) {
            startTime = currentTime;
        }

        var timeElapsed = currentTime - startTime;
        var run = ease(timeElapsed, startPosition, distance, duration)
        window.scrollTo(0, run);

        if (timeElapsed < duration) {
            requestAnimationFrame(animationScroll)
        }
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    requestAnimationFrame(animationScroll);
}

let ele = document.querySelector("a[href='#']");
ele.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScroll('.section2', 1000);
})

function loadData(file) {
    return new Promise((resolve, reject) => {
        d3.csv(file, function (error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

function displayRelationNodes(data, type, width_, height_) {
    let width = width_ || window.innerWidth
    let height = height_ || window.innerHeight
    let svg = d3.select('svg')
        .attr('width', 0.9 * width)
        .attr('height', 1000)

    let selectedId;
    // simulatin setup with all forces
    let simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(-STRENGTH))
        .force('center', d3.forceCenter(width / 2, height * HEIGHT_FACTOR))
        // prevent nodes from ovelapping, treating them as circles with the given radius:
        .force("collide", d3.forceCollide((NODE_RADIUS + 2) / 2))

    function getNodeColor(node) {
        return node.relation === '自己' ? 'red' : 'gray'
    }

    if (type === 2) {
        svg.selectAll('g').data([]).exit().remove();
    }

    let links = createLinks();

    const linkGroup = svg.append("g").attr("class", "links")
    const nodeGroup = svg.append("g").attr("class", "nodes")
    const textGroup = svg.append("g").attr("class", "texts")

    const linkElements = linkGroup
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke-width', 0.7)
        .attr('stroke', (d)=>{
            if (d.relation === '兄弟') {
                return COLOR.brotherColor
            } else if (d.relation === '降将') {
                return COLOR.generalColor
            } else if (d.relation === '好兄弟') {
                return COLOR.goodColor
            }
            return '#E5E5E5'
        })

    const nodeElements = nodeGroup
        .selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('r', 10)
        .attr('fill', getNodeColor)

    const textElements = textGroup
        .selectAll('text')
        .data(data)
        .enter().append('text')
        .text(node => node.name)
        .attr('font-size', 12)
        .attr('dx', 12)
        .attr('dy', 6)

    // const nickNames = svg.append('g')
    //     .selectAll('text')
    //     .data(data)
    //     .enter().append('text')
    //     .text(node => node.nickname)
    //     .attr('font-size', 10)
    //     .attr('dx', 20)
    //     .attr('dy', 18)

    // console.log(data,'before');
    simulation.nodes(data).on('tick', () => {
        linkElements
            .attr('x1', link => getNodeXCoordinate(link.source.x + NODE_RADIUS))
            .attr('y1', link => getNodeYCoordinate(link.source.y + NODE_RADIUS))
            .attr('x2', link => getNodeXCoordinate(link.target.x + NODE_RADIUS))
            .attr('y2', link => getNodeYCoordinate(link.target.y + NODE_RADIUS))
        nodeElements
            .attr('cx', node => getNodeXCoordinate(node.x))
            .attr('cy', node => getNodeYCoordinate(node.y))
        textElements
            .attr('x', node => getNodeXCoordinate(node.x))
            .attr('y', node => getNodeYCoordinate(node.y))
        // nickNames
        //     .attr('x', node => node.x)
        //     .attr('y', node => node.y)

    })

    // for links

    simulation.force('link', d3.forceLink()
        .id(link => link.name)
        .strength(link => link.strength))

    simulation.force('link').links(links);


    function createLinks() {
        let links = [];

        data.forEach(ele => {
            if (ele.relation !== '自己') {
                if (ele.group !== '无党派') {
                    let link = {};
                    link.target = ele.group;
                    link.source = ele.name;
                    link.strength = BASIC_STRENGTH;
                    link.relation = ele.relation;
                    links.push(link)
                }
            }
        })
        console.log(links);
        return links;
    }
    // ---checked

    const dragDrop = d3.drag()
        .on('start', node => {
            if (!d3.event.active) {
                simulation.alphaTarget(0.9).restart();
            }
            node.fx = node.x;
            node.fy = node.y
        })
        .on('drag', node => {
            // console.log(node);
            node.fx = d3.event.x
            node.fy = d3.event.y
        })
        .on('end', node => {
            if (!d3.event.active) {
                simulation.alphaTarget(0)
            }
            node.fx = null
            node.fy = null
        })

    nodeElements.call(dragDrop)
    // .on('click',selectNode);

    const tooltip = d3.select('#relation').append("div")
        .classed("tooltip", true)
        .style("opacity", 0);
    nodeElements
        .on("mouseover", function (d) {
            if (d.relation) {
                tooltip.transition()
                    .duration(300)
                    .style("opacity", 1) // show the tooltip
                tooltip.html(() => {
                        if (d.relation === '自己') {
                            return d.nickname;
                        } else {
                            return d.relation + "<br/>" + d.nickname;
                        }
                    })
                    .style("left", (d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5) + "px")
                    .style("top", (d3.event.pageY - d3.select('.tooltip').node().offsetHeight) + "px");
            }
        })
        .on("mouseleave", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0)
        })

    let factor  = 0.1;
    let h = 1;
    // functions to avoid nodes and links going outside the svg container, when calculating the position:
    function getNodeXCoordinate(x) {
        return Math.max(0, Math.min(0.9 * width - NODE_RADIUS, x))
    }

    function getNodeYCoordinate(y) {
        return Math.max(0, Math.min(900 - NODE_RADIUS, y))
        // let y_ = Math.max(0, Math.min(900 - NODE_RADIUS, y));
        // if (y_> 880) {
        //     y_= y_ * factor * h;
        //     h = (h + 1) % 9;
        // }

        // return  y_
    }

    /**
     * @requires after createLinks
     * key:name
     */
    function getNeighbors(node) {
        return links.reduce((neighbors, link) => {
            if (link.target.name === node.name) {
                neighbors.push(link.source.name)
            } else if (link.source.name === node.name) {
                neighbors.push(link.target.name)
            }
            return neighbors
        }, [node.name])
    }
    function isNeighborLink(node, link) {
        return link.target.name === node.name || link.source.name === node.name
    }

    return simulation;
}

function handleRelationData(data) {
    let groups = {
        "无党派": []
    };
    data.forEach(ele => {
        let _group = ele.group;
        if (_group === "无党派") {
            groups["无党派"].push(ele);
        } else if (groups.hasOwnProperty(_group)) {
            groups[_group].push(ele)
        } else {
            groups[_group] = [ele];
        }
    });
    // console.log(groups);
    return groups;
}

loadData('./data/relation.csv')
    .then(data => {
        console.log(data);
        // 分组点击事件
        let groups = handleRelationData(data);
        let currentData = data;
        // currentData = groups['无党派'];
        console.log(groups);
        document.getElementById('groups').addEventListener('click',function(event){
            // let target = event.target;
            // if (target.tagName != 'IMG') {
            //     return;
            // }
            let $parent = event.target.closest('div');
            if (!$parent) return;
            if ($parent.className != 'item') return;
            let group = $parent.dataset.group;
            if (group) {
                currentData = groups[group];
                s = displayRelationNodes(currentData, 2, 1000);
                s.alphaTarget(0.7).restart()
            }
        })
        let s = displayRelationNodes(currentData, 1, 1000)

        window.addEventListener('resize', () => {
            s = displayRelationNodes(currentData, 2, 1000)
        }, false);

        document.getElementById('fresh-button').onclick = function () {
            // s.restart();
            currentData = data
            s = displayRelationNodes(currentData, 2, 1000)

        }
    })
    .catch(error => {
        console.log(error);
    });