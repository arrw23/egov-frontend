import React from "react";

export function Head({
  over,
  title,
  text,
  action,
}: {
  over: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="head">
      <div>
        <label>{over}</label>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}

export function Status({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`status ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function Stat({
  Icon,
  label,
  value,
  note,
  tone = "blue",
}: {
  Icon: any;
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      <i className={tone}>
        <Icon size={24} />
      </i>
      <span>
        <label>{label}</label>
        <b>{value}</b>
        <small>{note}</small>
      </span>
    </div>
  );
}
