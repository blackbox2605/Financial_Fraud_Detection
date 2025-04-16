import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualizer = ({ edges, suspicious }) => {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;

    svg.attr('viewBox', [0, 0, width, height]);

    // Background Gradient
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#gradient)');

    const defs = svg.append('defs');

    const gradient = defs.append('linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#1e3c72');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#2a5298');

    // ClipPath to restrict drawing within bounds
    svg.append("clipPath")
      .attr("id", "graphClip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // Arrowheads
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Nodes
    const nodeSet = new Set();
    edges.forEach(e => {
      nodeSet.add(e.from);
      nodeSet.add(e.to);
    });

    const nodes = Array.from(nodeSet).map(id => ({ id }));
    const links = edges.map(e => ({
      source: e.from,
      target: e.to,
      weight: e.weight,
      suspicious: suspicious.some(s => s.from === e.from && s.to === e.to && s.weight === e.weight),
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(40));

    const link = svg.append('g')
      .attr('clip-path', 'url(#graphClip)')
      .attr('stroke-width', 2)
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => d.suspicious ? '#ff4d4d' : '#aaa')
      .attr('marker-end', 'url(#arrow)')
      .style('filter', d => d.suspicious ? 'drop-shadow(0px 0px 4px red)' : 'none');

    const linkText = svg.append('g')
      .attr('clip-path', 'url(#graphClip)')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .text(d => `$${d.weight}`)
      .attr('font-size', '12px')
      .attr('fill', '#f0f0f0');

    const node = svg.append('g')
      .attr('clip-path', 'url(#graphClip)')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 18)
      .attr('fill', '#00c6ff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).transition().duration(200).attr('r', 22).attr('fill', '#ff7e5f');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('r', 18).attr('fill', '#00c6ff');
      })
      .call(drag(simulation));

    const label = svg.append('g')
      .attr('clip-path', 'url(#graphClip)')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.id)
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dy', 4);

    simulation.on('tick', () => {
      // Clamp nodes inside container
      node
        .attr('cx', d => d.x = Math.max(20, Math.min(width - 20, d.x)))
        .attr('cy', d => d.y = Math.max(20, Math.min(height - 20, d.y)));

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkText
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);
    });

    function drag(simulation) {
      return d3.drag()
        .on('start', event => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', event => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', event => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }
  }, [edges, suspicious]);

  return (
    <svg
      ref={ref}
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '10px',
        boxShadow: '0 0 12px rgba(0,0,0,0.3)',
        backgroundColor: '#1e3c72',
        overflow: 'hidden'
      }}
    />
  );
};

export default GraphVisualizer;
