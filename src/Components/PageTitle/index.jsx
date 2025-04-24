import React from "react"
import "./style.css"

export default function PageTitle({ title }) {

    return (
        <div className="pd-horizontal bg-white bottom-shadow sticky-position">
            <div className="d-flex py-2 align-items-center justify-content-center">
                <p className="xl-fs bold-fw black-text">{title}</p>
            </div>
        </div>
    )
}